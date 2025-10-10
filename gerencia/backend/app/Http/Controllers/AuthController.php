<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

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

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $usuario = Usuario::where('usr_email', $data['email'])->first();

        if (! $usuario) {
            return response()->json([
                'message' => 'Se o e-mail estiver cadastrado, enviaremos instrucoes para recuperar a senha em instantes.'
            ]);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $usuario->usr_email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        Log::info('Token de redefinicao de senha gerado.', [
            'email' => $usuario->usr_email,
            'token' => $token,
        ]);

        return response()->json([
            'message' => 'Se o e-mail estiver cadastrado, enviaremos instrucoes para recuperar a senha em instantes.'
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'senha' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $data['email'])->first();

        if (! $record) {
            return response()->json([
                'message' => 'Token invalido ou expirado.',
            ], 422);
        }

        $createdAt = $record->created_at ? Carbon::parse($record->created_at) : null;
        $tokenExpirado = $createdAt === null || $createdAt->addMinutes(60)->isPast();

        if ($tokenExpirado || ! Hash::check($data['token'], $record->token)) {
            return response()->json([
                'message' => 'Token invalido ou expirado.',
            ], 422);
        }

        $usuario = Usuario::where('usr_email', $data['email'])->first();

        if (! $usuario) {
            return response()->json([
                'message' => 'Usuario nao encontrado.',
            ], 404);
        }

        $usuario->usr_senha = Hash::make($data['senha']);
        $usuario->save();

        $usuario->tokens()->delete();
        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        return response()->json([
            'message' => 'Senha redefinida com sucesso. Faça login com a nova senha.'
        ]);
    }
}
