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
            'senha' => ['required']
        ]);

        $usuario = Usuario::where('usr_email', $data['email'])->first();

        if (! $usuario || ! Hash::check($data['senha'], $usuario->usr_senha)) {
            abort(401, 'Credenciais invÃƒÂ¡lidas.');
        }

        $token = $usuario->createToken('app-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'usuario' => [
                'id' => $usuario->usr_id,
                'nome' => $usuario->usr_nome,
                'papel' => $usuario->usr_papel,
                'superadmin' => $usuario->usr_superadmin,
                'conta_id' => $usuario->usr_ctaid,
            ]
        ]);
    }
}
