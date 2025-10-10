<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\Conta;
use App\Models\Lead;
use App\Services\LeadAssignmentService;
use App\Services\LeadStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function __construct(
        private readonly LeadStatusService $statusService,
        private readonly LeadAssignmentService $assignmentService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Conta $conta */
        $conta = $request->attributes->get('tenant');

        $query = Lead::query()
            ->where('led_ctaid', $conta->cta_id)
            ->with([
                'responsavel:usr_id,usr_nome,usr_email,usr_papel,usr_ctaid',
                'instanciaWhatsapp:iwh_id,iwh_nome',
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

        $leads = $query->paginate($request->integer('per_page', 15));

        return response()->json($leads);
    }

    public function show(Request $request, Lead $lead): JsonResponse
    {
        $this->authorizeLead($request, $lead);

        $lead->load([
            'mensagens' => fn ($q) => $q->orderByDesc('msg_recebido_em')->limit(50),
            'logs' => fn ($q) => $q->orderByDesc('created_at')->limit(20),
            'auditoriasIa' => fn ($q) => $q->orderByDesc('created_at')->limit(10),
            'responsavel:usr_id,usr_nome,usr_email,usr_papel,usr_ctaid',
        ]);

        return response()->json($lead);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $conta = $this->authorizeLead($request, $lead);

        $data = $request->validate([
            'led_nome' => ['sometimes', 'string', 'max:255'],
            'led_email' => ['nullable', 'email'],
            'led_telefone' => ['nullable', 'string', 'max:30'],
            'led_responsavel_usrid' => ['nullable', 'integer'],
            'led_observacoes' => ['nullable', 'string'],
            'led_valor_total' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (array_key_exists('led_responsavel_usrid', $data)) {
            $responsavelId = $data['led_responsavel_usrid'] !== null ? (int) $data['led_responsavel_usrid'] : null;
            $this->assignmentService->assign($lead, $responsavelId, $conta, true);
            unset($data['led_responsavel_usrid']);
        }

        $lead->fill($data);
        $lead->save();

        return response()->json($lead->load('responsavel:usr_id,usr_nome,usr_email,usr_papel,usr_ctaid'));
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
                $data['valor_total'] ?? null
            );
        } catch (\InvalidArgumentException $exception) {
            abort(422, $exception->getMessage());
        }

        $lead->refresh()->load('responsavel:usr_id,usr_nome,usr_email,usr_papel,usr_ctaid');

        return response()->json($lead);
    }

    protected function authorizeLead(Request $request, Lead $lead): Conta
    {
        /** @var Conta $conta */
        $conta = $request->attributes->get('tenant');

        abort_if($lead->led_ctaid !== $conta->cta_id, 403, 'Lead nao pertence a conta.');

        return $conta;
    }
}

