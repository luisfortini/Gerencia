<?php

namespace App\Http\Controllers;

use App\Models\Conta;
use App\Models\Usuario;
use App\Services\UsuarioLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function __construct(private readonly UsuarioLimitService $usuarioLimit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Conta $conta */
        $conta = $request->attributes->get('tenant');

        $usuarios = Usuario::query()
            ->select(['usr_id', 'usr_nome', 'usr_email', 'usr_papel', 'usr_admin', 'usr_ativo', 'created_at', 'updated_at'])
            ->where('usr_ctaid', $conta->cta_id)
            ->orderBy('usr_nome')
            ->get();

        $limite = (int) ($conta->cta_limite_usuarios ?? 0);
        $ativos = $usuarios->where('usr_ativo', true)->count();

        return response()->json([
            'usuarios' => $usuarios,
            'limite' => $limite,
            'total_ativos' => $ativos,
            'disponiveis' => $limite > 0 ? max(0, $limite - $ativos) : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Conta $conta */
        $conta = $request->attributes->get('tenant');

        $data = $request->validate([
            'usr_nome' => ['required', 'string', 'max:150'],
            'usr_email' => ['required', 'email', 'unique:usuario,usr_email'],
            'usr_senha' => ['required', 'string', 'min:8'],
            'usr_papel' => ['required', Rule::in(['gestor', 'operador'])],
            'usr_admin' => ['sometimes', 'boolean'],
            'usr_ativo' => ['sometimes', 'boolean'],
        ]);

        $ativo = array_key_exists('usr_ativo', $data) ? (bool) $data['usr_ativo'] : true;

        if ($ativo) {
            $this->usuarioLimit->assertCanAddActiveUsers($conta);
        }

        $usuario = Usuario::create([
            'usr_ctaid' => $conta->cta_id,
            'usr_nome' => $data['usr_nome'],
            'usr_email' => $data['usr_email'],
            'usr_senha' => Hash::make($data['usr_senha']),
            'usr_papel' => $data['usr_papel'],
            'usr_superadmin' => false,
            'usr_admin' => (bool) ($data['usr_admin'] ?? false),
            'usr_ativo' => $ativo,
        ]);

        return response()->json($usuario, 201);
    }

    public function update(Request $request, Usuario $usuario): JsonResponse
    {
        /** @var Conta $conta */
        $conta = $this->authorizeUsuario($request, $usuario);

        $data = $request->validate([
            'usr_nome' => ['sometimes', 'string', 'max:150'],
            'usr_email' => ['sometimes', 'email', Rule::unique('usuario', 'usr_email')->ignore($usuario->usr_id, 'usr_id')],
            'usr_senha' => ['sometimes', 'nullable', 'string', 'min:8'],
            'usr_papel' => ['sometimes', Rule::in(['gestor', 'operador'])],
            'usr_admin' => ['sometimes', 'boolean'],
            'usr_ativo' => ['sometimes', 'boolean'],
        ]);

        $novoAdmin = array_key_exists('usr_admin', $data) ? (bool) $data['usr_admin'] : $usuario->usr_admin;
        $novoAtivo = array_key_exists('usr_ativo', $data) ? (bool) $data['usr_ativo'] : $usuario->usr_ativo;

        if ($usuario->usr_admin && (! $novoAdmin || ! $novoAtivo)) {
            $this->assertAnotherAdminExists($conta, $usuario);
        }

        if (! $usuario->usr_ativo && $novoAtivo) {
            $this->usuarioLimit->assertCanAddActiveUsers($conta, 1, $usuario);
        }

        if (isset($data['usr_nome'])) {
            $usuario->usr_nome = $data['usr_nome'];
        }

        if (isset($data['usr_email'])) {
            $usuario->usr_email = $data['usr_email'];
        }

        if (isset($data['usr_papel'])) {
            $usuario->usr_papel = $data['usr_papel'];
        }

        if (array_key_exists('usr_admin', $data)) {
            $usuario->usr_admin = (bool) $data['usr_admin'];
        }

        if (array_key_exists('usr_ativo', $data)) {
            $usuario->usr_ativo = (bool) $data['usr_ativo'];
        }

        if (array_key_exists('usr_senha', $data) && filled($data['usr_senha'])) {
            $usuario->usr_senha = Hash::make($data['usr_senha']);
        }

        $usuario->save();
        $usuario->refresh();

        return response()->json($usuario);
    }

    public function options(Request $request): JsonResponse
    {
        /** @var Conta|null $conta */
        $conta = $request->attributes->get('tenant');

        abort_if(! $conta, 403, 'Conta nao identificada.');

        $usuarios = Usuario::query()
            ->select(['usr_id', 'usr_nome', 'usr_email', 'usr_papel', 'usr_admin'])
            ->where('usr_ctaid', $conta->cta_id)
            ->where('usr_ativo', true)
            ->orderBy('usr_nome')
            ->get()
            ->map(fn (Usuario $usuario) => [
                'id' => $usuario->usr_id,
                'nome' => $usuario->usr_nome,
                'email' => $usuario->usr_email,
                'papel' => $usuario->usr_papel,
                'admin' => (bool) $usuario->usr_admin,
            ]);

        return response()->json($usuarios);
    }

    public function destroy(Request $request, Usuario $usuario)
    {
        /** @var Conta $conta */
        $conta = $this->authorizeUsuario($request, $usuario);

        if ($usuario->usr_admin) {
            $this->assertAnotherAdminExists($conta, $usuario);
        }

        $usuario->delete();

        return response()->noContent();
    }

    protected function authorizeUsuario(Request $request, Usuario $usuario): Conta
    {
        /** @var Conta|null $conta */
        $conta = $request->attributes->get('tenant');

        abort_if(! $conta, 403, 'Conta nao identificada.');
        abort_if($usuario->usr_superadmin, 403, 'Nao e possivel modificar super administradores.');
        abort_if($usuario->usr_ctaid !== $conta->cta_id, 403, 'Usuario nao pertence a conta.');

        return $conta;
    }

    protected function assertAnotherAdminExists(Conta $conta, Usuario $usuario): void
    {
        $outrosAdmins = Usuario::query()
            ->where('usr_ctaid', $conta->cta_id)
            ->where('usr_admin', true)
            ->where('usr_ativo', true)
            ->where('usr_id', '!=', $usuario->usr_id)
            ->count();

        abort_if($outrosAdmins === 0, 422, 'Mantenha ao menos um administrador ativo na conta.');
    }
}
