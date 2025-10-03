<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\InstanciaWhatsapp;
use App\Models\Lead;
use App\Models\LeadOrigem;
use App\Models\Usuario;
use App\Services\LeadStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\\Http\\Request;\nuse Illuminate\\Support\\Str;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function __construct(private readonly LeadStatusService $statusService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        $query = Lead::query()
            ->where('led_ctaid', $conta->cta_id)
            ->with([
                'responsavel:usr_id,usr_nome',
                'instanciaWhatsapp:iwh_id,iwh_nome',
                'origem:lor_id,lor_nome,lor_slug,lor_padrao',
            ]);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $like = "%$search%";
                $q->where('led_nome', 'like', $like)
                    ->orWhere('led_email', 'like', $like)
                    ->orWhere('led_telefone', 'like', $like)
                    ->orWhere('led_status', 'like', $like);
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('led_status', $status);
        }

        if ($responsavel = $request->integer('responsavel_id')) {
            $query->where('led_responsavel_usrid', $responsavel);
        }

        if ($instancia = $request->integer('instancia_id')) {
            $query->where('led_iwhid', $instancia);
        }

        if ($origem = $request->integer('origem_id')) {
            $query->where('led_lorid', $origem);
        }

        $leads = $query->paginate($request->integer('per_page', 15));

        return response()->json($leads);
    }

    public function store(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'origem_id' => ['nullable', 'integer'],
            'origem_texto' => ['nullable', 'string', 'max:150'],
            'origem' => ['nullable', 'string', 'max:150'],
            'instancia_id' => ['nullable', 'integer'],
            'responsavel_id' => ['nullable', 'integer'],
            'valor_total' => ['nullable', 'numeric', 'min:0'],
            'observacoes' => ['nullable', 'string'],
            'data_nascimento' => ['nullable', 'date'],
        ]);

        $origemTexto = $data['origem_texto'] ?? $data['origem'] ?? null;
        if (is_string($origemTexto)) {
            $origemTexto = trim($origemTexto);
            if ($origemTexto === '') {
                $origemTexto = null;
            }
        }

        $origem = $this->resolveOrigem($conta->cta_id, $data['origem_id'] ?? null, $origemTexto);
        $instancia = $this->resolveInstancia($conta->cta_id, $data['instancia_id'] ?? null);
        $responsavel = $this->resolveResponsavel($conta->cta_id, $data['responsavel_id'] ?? null);

        $telefone = $data['telefone'] ?? null;
        $telefoneNormalizado = $telefone ? normalize_phone($telefone) : null;

        $lead = Lead::create([
            'led_ctaid' => $conta->cta_id,
            'led_iwhid' => $instancia?->iwh_id,
            'led_responsavel_usrid' => $responsavel?->usr_id,
            'led_nome' => trim($data['nome']),
            'led_telefone' => $telefoneNormalizado ?: $telefone,
            'led_email' => $data['email'] ?? null,
            'led_status' => LeadStatus::NOVO->value,
            'led_status_conf' => 0,
            'led_etapa' => LeadStatus::NOVO->value,
            'led_valor_total' => $data['valor_total'] ?? null,
            'led_origem' => $origem?->lor_nome ?? $origemTexto,
            'led_lorid' => $origem?->lor_id,
            'led_observacoes' => $data['observacoes'] ?? null,
            'led_data_nascimento' => $data['data_nascimento'] ?? null,
        ]);

        $lead->load(['responsavel:usr_id,usr_nome', 'instanciaWhatsapp:iwh_id,iwh_nome', 'origem']);

        return response()->json($lead, 201);
    }

    public function show(Request $request, Lead $lead): JsonResponse
    {
        $this->authorizeLead($request, $lead);

        $lead->load([
            'mensagens' => fn ($q) => $q->orderByDesc('msg_recebido_em')->limit(50),
            'logs' => fn ($q) => $q->orderByDesc('created_at')->limit(20),
            'auditoriasIa' => fn ($q) => $q->orderByDesc('created_at')->limit(10),
            'origem',
        ]);

        return response()->json($lead);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $this->authorizeLead($request, $lead);

        $data = $request->validate([
            'led_nome' => ['sometimes', 'string', 'max:255'],
            'led_email' => ['nullable', 'email'],
            'led_telefone' => ['nullable', 'string', 'max:30'],
            'led_responsavel_usrid' => ['nullable', 'integer'],
            'led_observacoes' => ['nullable', 'string'],
            'led_valor_total' => ['nullable', 'numeric', 'min:0'],
            'origem_id' => ['nullable', 'integer'],
            'origem_texto' => ['nullable', 'string', 'max:150'],
            'led_iwhid' => ['nullable', 'integer'],
            'led_data_nascimento' => ['nullable', 'date'],
        ]);

        if (array_key_exists('origem_id', $data) || array_key_exists('origem_texto', $data)) {
            $origem = $this->resolveOrigem($lead->led_ctaid, $data['origem_id'] ?? null, $data['origem_texto'] ?? null);
            $lead->led_lorid = $origem?->lor_id;
            $lead->led_origem = $origem?->lor_nome ?? ($data['origem_texto'] ?? $lead->led_origem);
        }

        if (array_key_exists('led_iwhid', $data)) {
            $instancia = $this->resolveInstancia($lead->led_ctaid, $data['led_iwhid']);
            $lead->led_iwhid = $instancia?->iwh_id;
        }

        if (array_key_exists('led_responsavel_usrid', $data)) {
            $responsavel = $this->resolveResponsavel($lead->led_ctaid, $data['led_responsavel_usrid']);
            $lead->led_responsavel_usrid = $responsavel?->usr_id;
        }

        if (array_key_exists('led_telefone', $data)) {
            $lead->led_telefone = $data['led_telefone'] ? normalize_phone($data['led_telefone']) : null;
        }

        $lead->fill(collect($data)->except(['origem_id', 'origem_texto', 'led_iwhid'])->toArray());
        $lead->save();
        $lead->load('origem');

        return response()->json($lead);
    }

    public function changeStatus(Request $request, Lead $lead): JsonResponse
    {
        $this->authorizeLead($request, $lead);

        $usuario = $request->user();

        $data = $request->validate([
            'status' => ['required', Rule::in(array_column(LeadStatus::cases(), 'value'))],
            'motivo' => ['nullable', 'string'],
            'valor_total' => ['nullable', 'numeric', 'min:0'],
        ]);

        try {
            $this->statusService->applyManual(
                $lead,
                $data['status'],
                $usuario,
                $data['motivo'] ?? null,
                $data['valor_total'] ?? null,
            );
        } catch (\InvalidArgumentException $exception) {
            abort(422, $exception->getMessage());
        }

        $lead->refresh();

        return response()->json($lead);
    }

    protected function authorizeLead(Request $request, Lead $lead): void
    {
        $conta = $request->attributes->get('tenant');

        abort_if($lead->led_ctaid !== $conta->cta_id, 403, 'Lead nao pertence a conta.');
    }

    protected function resolveOrigem(int $contaId, ?int $origemId, ?string $origemTexto = null): ?LeadOrigem
    {
        if ($origemId) {
            return LeadOrigem::where('lor_ctaid', $contaId)->where('lor_id', $origemId)->first();
        }

        if ($origemTexto) {
            $nome = trim($origemTexto);
            if ($nome === '') {
                return null;
            }

            return LeadOrigem::firstOrCreate(
                [
                    'lor_ctaid' => $contaId,
                    'lor_slug' => Str::slug($nome),
                ],
                [
                    'lor_nome' => $nome,
                    'lor_padrao' => false,
                ]
            );
        }

        return LeadOrigem::where('lor_ctaid', $contaId)
            ->orderByDesc('lor_padrao')
            ->orderBy('lor_nome')
            ->first();
    }

    protected function resolveInstancia(int $contaId, ?int $instanciaId): ?InstanciaWhatsapp
    {
        if (! $instanciaId) {
            return null;
        }

        return InstanciaWhatsapp::where('iwh_ctaid', $contaId)
            ->where('iwh_id', $instanciaId)
            ->first();
    }

    protected function resolveResponsavel(int $contaId, ?int $responsavelId): ?Usuario
    {
        if (! $responsavelId) {
            return null;
        }

        return Usuario::where('usr_ctaid', $contaId)
            ->where('usr_id', $responsavelId)
            ->first();
    }
}