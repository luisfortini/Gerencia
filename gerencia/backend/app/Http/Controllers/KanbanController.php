<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Services\LeadStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KanbanController extends Controller
{
    public function __construct(private readonly LeadStatusService $statusService)
    {
    }

    public function move(Request $request, Lead $lead): JsonResponse
    {
        $this->authorizeLead($request, $lead);

        $data = $request->validate([
            'coluna' => ['required', Rule::in(array_column(LeadStatus::cases(), 'value'))],
            'motivo' => ['nullable', 'string'],
            'valor_total' => ['nullable', 'numeric', 'min:0']
        ]);

        try {
            $this->statusService->applyManual(
                $lead,
                $data['coluna'],
                $request->user(),
                $data['motivo'] ?? null,
                $data['valor_total'] ?? null
            );
        } catch (\InvalidArgumentException $exception) {
            abort(422, $exception->getMessage());
        }

        return response()->json($lead->fresh());
    }

    protected function authorizeLead(Request $request, Lead $lead): void
    {
        $conta = $request->attributes->get('tenant');

        abort_if($lead->led_ctaid !== $conta->cta_id, 403, 'Lead nÃƒÂ£o pertence ÃƒÂ  conta.');
    }
}
