<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'senha' => ['required'],
        ]);

        $usuario = Usuario::where('usr_email', $data['email'])->first();

        if (! $usuario || ! Hash::check($data['senha'], $usuario->usr_senha)) {
            abort(401, 'Credenciais invalidas.');
        }

        $expirationMinutes = config('sanctum.expiration');
        $expiresAt = $expirationMinutes ? now()->addMinutes($expirationMinutes) : null;

        $tokenInstance = $usuario->createToken('app-token', ['*'], $expiresAt);

        $token = $tokenInstance->plainTextToken;
        $tokenExpiresAt = optional($tokenInstance->accessToken->expires_at)->toIso8601String();

        return response()->json([
            'token' => $token,
            'token_expires_at' => $tokenExpiresAt,
            'usuario' => [
                'id' => $usuario->usr_id,
                'nome' => $usuario->usr_nome,
                'papel' => $usuario->usr_papel,
                'superadmin' => $usuario->usr_superadmin,
                'admin' => $usuario->usr_superadmin || $usuario->usr_admin,
                'conta_id' => $usuario->usr_ctaid,
            ],
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $data = $request->validate([
            'senha_atual' => ['required'],
            'nova_senha' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['senha_atual'], $usuario->usr_senha)) {
            return response()->json([
                'message' => 'Senha atual incorreta.',
            ], 422);
        }

        $usuario->usr_senha = Hash::make($data['nova_senha']);
        $usuario->save();

        $usuario->tokens()->delete();

        $expirationMinutes = config('sanctum.expiration');
        $expiresAt = $expirationMinutes ? now()->addMinutes($expirationMinutes) : null;

        $tokenInstance = $usuario->createToken('app-token', ['*'], $expiresAt);

        return response()->json([
            'message' => 'Senha atualizada com sucesso.',
            'token' => $tokenInstance->plainTextToken,
            'token_expires_at' => optional($tokenInstance->accessToken->expires_at)->toIso8601String(),
            'usuario' => [
                'id' => $usuario->usr_id,
                'nome' => $usuario->usr_nome,
                'papel' => $usuario->usr_papel,
                'superadmin' => $usuario->usr_superadmin,
                'admin' => $usuario->usr_superadmin || $usuario->usr_admin,
                'conta_id' => $usuario->usr_ctaid,
            ],
        ]);
    }
}
