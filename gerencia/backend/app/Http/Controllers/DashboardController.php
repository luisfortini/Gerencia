<?php
namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\AuditoriaIa;
use App\Models\Lead;
use App\Models\LogStatusLead;
use App\Services\SystemSettingService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly SystemSettingService $settings,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        if (! $conta) {
            abort(403, 'Conta nao encontrada para o usuario autenticado.');
        }

        $periodKey = $request->string('period')->toString() ?: '7d';
        $periodDays = $this->resolvePeriodDays($periodKey);
        $startDate = Carbon::now()->subDays($periodDays - 1)->startOfDay();

        $whatsappId = $this->resolveWhatsappId($request->input('whatsapp'));
        $search = trim((string) $request->input('search', ''));

        $leadQuery = $this->applyLeadFilters(Lead::query(), $conta->cta_id, $whatsappId, $search);

        $totalLeads = (clone $leadQuery)->count();
        $leadsNoPeriodo = (clone $leadQuery)->where('created_at', '>=', $startDate)->count();

        $ganhos = $this->countStatusChanges('ganho', $conta->cta_id, $whatsappId, $search, $startDate);
        $perdidos = $this->countStatusChanges('perdido', $conta->cta_id, $whatsappId, $search, $startDate);

        $valorNegociadoTotal = (clone $leadQuery)->sum('led_valor_total');

        $valorGanhoTotal = (clone $leadQuery)
            ->where('led_status', LeadStatus::GANHO->value)
            ->sum('led_valor_total');

        $ticketMedio = $ganhos > 0 ? round($valorGanhoTotal / $ganhos) : 0;
        $taxaConversao = ($ganhos + $perdidos) > 0 ? round($ganhos / ($ganhos + $perdidos) * 100, 1) : 0.0;
        $tempoMedioPrimeiraResposta = $this->calcularTempoMedioPrimeiraResposta($conta->cta_id, $whatsappId, $search, $startDate);

        $serieDiaria = $this->buildSerieDiaria($conta->cta_id, $whatsappId, $search, $startDate, $periodDays);
        $porStatus = $this->buildStatusDistribution($leadQuery);
        $funil = $this->buildFunil($leadQuery);
        $objecoes = $this->buildTopObjecoes($conta->cta_id, $whatsappId, $search, $startDate);
        $alertas = $this->buildAlertas($leadQuery);
        $metaPrimeiraRespostaMin = $this->resolveMetaPrimeiraResposta((int) $conta->cta_id);

        return response()->json([
            'kpis' => [
                'totalLeads' => $totalLeads,
                'leadsNoPeriodo' => $leadsNoPeriodo,
                'ganhos' => $ganhos,
                'perdidos' => $perdidos,
                'taxaConversao' => $taxaConversao,
                'valorNegociadoTotal' => (float) $valorNegociadoTotal,
                'valorGanhoTotal' => (float) $valorGanhoTotal,
                'ticketMedio' => (float) $ticketMedio,
                'tempoMedioPrimeiraRespostaMin' => $tempoMedioPrimeiraResposta,
            ],
            'serieDiaria' => $serieDiaria,
            'porStatus' => $porStatus,
            'objecoes' => $objecoes,
            'funil' => $funil,
            'metas' => [
                'metaConversao' => 35,
                'metaPrimeiraRespostaMin' => $metaPrimeiraRespostaMin,
            ],
            'alertas' => $alertas,
        ]);
    }

    private function resolvePeriodDays(string $period): int
    {
        return match ($period) {
            '30d' => 30,
            '90d' => 90,
            default => 7,
        };
    }

    private function resolveWhatsappId($value): ?int
    {
        if (empty($value) || $value === 'all') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        if (preg_match('/(\\d+)/', (string) $value, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    private function applyLeadFilters(Builder $query, int $contaId, ?int $whatsappId, string $search): Builder
    {
        $query->where('led_ctaid', $contaId);

        if ($whatsappId !== null) {
            $query->where('led_iwhid', $whatsappId);
        }

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $like = '%' . $search . '%';
                $builder
                    ->where('led_nome', 'like', $like)
                    ->orWhere('led_telefone', 'like', $like);
            });
        }

        return $query;
    }

    private function countStatusChanges(string $status, int $contaId, ?int $whatsappId, string $search, Carbon $startDate): int
    {
        return LogStatusLead::query()
            ->where('lsl_status_novo', $status)
            ->where('created_at', '>=', $startDate)
            ->whereHas('lead', $this->leadFilterClosure($contaId, $whatsappId, $search))
            ->count();
    }

    private function statusChangeDaily(string $status, int $contaId, ?int $whatsappId, string $search, Carbon $startDate)
    {
        return LogStatusLead::query()
            ->where('lsl_status_novo', $status)
            ->where('created_at', '>=', $startDate)
            ->whereHas('lead', $this->leadFilterClosure($contaId, $whatsappId, $search))
            ->selectRaw('DATE(created_at) as dia, COUNT(*) as total')
            ->groupBy('dia')
            ->pluck('total', 'dia');
    }

    private function buildSerieDiaria(int $contaId, ?int $whatsappId, string $search, Carbon $startDate, int $periodDays): array
    {
        $novosPorDia = $this->applyLeadFilters(Lead::query(), $contaId, $whatsappId, $search)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as dia, COUNT(*) as total')
            ->groupBy('dia')
            ->pluck('total', 'dia');

        $ganhosPorDia = $this->statusChangeDaily('ganho', $contaId, $whatsappId, $search, $startDate);
        $perdidosPorDia = $this->statusChangeDaily('perdido', $contaId, $whatsappId, $search, $startDate);

        $serie = [];

        for ($i = 0; $i < $periodDays; $i++) {
            $dia = (clone $startDate)->addDays($i);
            $chave = $dia->toDateString();

            $serie[] = [
                'dia' => $dia->format('d/m'),
                'novos' => (int) ($novosPorDia[$chave] ?? 0),
                'ganhos' => (int) ($ganhosPorDia[$chave] ?? 0),
                'perdidos' => (int) ($perdidosPorDia[$chave] ?? 0),
            ];
        }

        return $serie;
    }

    private function buildStatusDistribution(Builder $leadQuery): array
    {
        $contagem = (clone $leadQuery)
            ->select('led_status', DB::raw('COUNT(*) as total'))
            ->groupBy('led_status')
            ->pluck('total', 'led_status');

        $mapa = [
            'novo' => 'Novo',
            'qualificado' => 'Qualificando',
            'interessado' => 'Interessado',
            'proposta_enviada' => 'Proposta Enviada',
            'negociacao' => 'Negociação',
            'ganho' => 'Ganho',
            'perdido' => 'Perdido',
            'follow_up' => 'Follow-up Futuro',
        ];

        $resultado = [];
        foreach ($mapa as $status => $label) {
            $resultado[] = [
                'status' => $label,
                'count' => (int) ($contagem[$status] ?? 0),
            ];
        }

        return $resultado;
    }

    private function buildFunil(Builder $leadQuery): array
    {
        $contagem = (clone $leadQuery)
            ->select('led_status', DB::raw('COUNT(*) as total'))
            ->groupBy('led_status')
            ->pluck('total', 'led_status');

        $funil = [
            'Descoberta' => ['novo'],
            'Qualificacao' => ['qualificado'],
            'Demonstracao' => ['interessado'],
            'Negociação' => ['negociacao'],
            'Fechamento' => ['ganho'],
        ];

        $resultado = [];
        foreach ($funil as $etapa => $statuses) {
            $valor = 0;
            foreach ($statuses as $status) {
                $valor += (int) ($contagem[$status] ?? 0);
            }

            $resultado[] = [
                'etapa' => $etapa,
                'valor' => $valor,
            ];
        }

        return $resultado;
    }

    private function buildTopObjecoes(int $contaId, ?int $whatsappId, string $search, Carbon $startDate): array
    {
        $auditorias = AuditoriaIa::query()
            ->where('created_at', '>=', $startDate->copy()->subDays(30))
            ->whereHas('lead', $this->leadFilterClosure($contaId, $whatsappId, $search))
            ->get(['aia_resposta']);

        $contagem = [];
        foreach ($auditorias as $auditoria) {
            $objecao = $auditoria->aia_resposta['objecao'] ?? null;
            if ($objecao) {
                $contagem[$objecao] = ($contagem[$objecao] ?? 0) + 1;
            }
        }

        arsort($contagem);

        return collect($contagem)
            ->take(6)
            ->map(fn ($total, $tipo) => ['tipo' => $tipo, 'count' => $total])
            ->values()
            ->all();
    }

    private function buildAlertas(Builder $leadQuery): array
    {
        $agora = Carbon::now();

        $alertas = (clone $leadQuery)
            ->whereIn('led_status', [
                LeadStatus::NOVO->value,
                LeadStatus::QUALIFICADO->value,
                LeadStatus::FOLLOW_UP->value,
                LeadStatus::NEGOCIACAO->value,
            ])
            ->where(function (Builder $query) use ($agora) {
                $query->whereNull('updated_at')
                    ->orWhere('updated_at', '<', $agora->copy()->subHours(12));
            })
            ->orderBy('updated_at', 'asc')
            ->limit(25)
            ->get();

        return $alertas->map(function (Lead $lead) use ($agora) {
            $label = $this->statusLabel($lead->led_status);
            $minutos = $lead->updated_at ? $lead->updated_at->diffInMinutes($agora) : null;

            return [
                'id' => (string) $lead->led_id,
                'lead' => $lead->led_nome ?? 'Lead ' . $lead->led_id,
                'telefone' => $lead->led_telefone ?? '',
                'status' => $label,
                'motivo' => $minutos ? 'Sem resposta há ' . max(1, intdiv($minutos, 60)) . 'h' : 'Sem atualizacao recente',
                'atrasoMin' => $minutos ?? 0,
            ];
        })->values()->all();
    }

    private function calcularTempoMedioPrimeiraResposta(int $contaId, ?int $whatsappId, string $search, Carbon $startDate): ?int
    {
        $leads = $this->applyLeadFilters(Lead::query(), $contaId, $whatsappId, $search)
            ->with(['mensagens' => function ($query) use ($startDate) {
                $query->where('msg_recebido_em', '>=', $startDate)->orderBy('msg_recebido_em');
            }])
            ->limit(200)
            ->get();

        $tempos = [];

        foreach ($leads as $lead) {
            $primeiraEntrada = null;
            $primeiraSaida = null;

            foreach ($lead->mensagens as $mensagem) {
                if ($mensagem->msg_direcao === 'in' && $primeiraEntrada === null) {
                    $primeiraEntrada = $mensagem->msg_recebido_em;
                }

                if ($primeiraEntrada && $mensagem->msg_direcao === 'out' && $mensagem->msg_recebido_em >= $primeiraEntrada) {
                    $primeiraSaida = $mensagem->msg_recebido_em;
                    break;
                }
            }

            if ($primeiraEntrada && $primeiraSaida) {
                $tempos[] = $primeiraEntrada->diffInMinutes($primeiraSaida);
            }
        }

        if (empty($tempos)) {
            return null;
        }

        return (int) round(array_sum($tempos) / max(count($tempos), 1));
    }

    private function leadFilterClosure(int $contaId, ?int $whatsappId, string $search): \Closure
    {
        return function (Builder $query) use ($contaId, $whatsappId, $search) {
            $this->applyLeadFilters($query, $contaId, $whatsappId, $search);
        };
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'novo' => 'Novo',
            'qualificado' => 'Qualificando',
            'interessado' => 'Interessado',
            'proposta_enviada' => 'Proposta Enviada',
            'negociacao' => 'Negociação',
            'ganho' => 'Ganho',
            'perdido' => 'Perdido',
            'follow_up' => 'Follow-up Futuro',
            default => ucfirst((string) $status),
        };
    }

    private function resolveMetaPrimeiraResposta(int $contaId): int
    {
        $default = $this->resolveDefaultMetaPrimeiraResposta();
        $stored = $this->settings->get($this->contaMetaKey($contaId));

        return $this->normalizeMetaValue($stored, $default);
    }

    private function resolveDefaultMetaPrimeiraResposta(): int
    {
        $fallback = 25;
        $stored = $this->settings->get('dashboard_meta_primeira_resposta_min');

        return $this->normalizeMetaValue($stored, $fallback);
    }

    private function normalizeMetaValue(mixed $value, int $fallback): int
    {
        if (is_array($value)) {
            $value = $value['meta_primeira_resposta_min'] ?? null;
        }

        if (is_numeric($value)) {
            $int = (int) $value;

            return max(1, min(1440, $int));
        }

        return $fallback;
    }

    private function contaMetaKey(int $contaId): string
    {
        return "conta:{$contaId}:dashboard_meta_primeira_resposta_min";
    }
}

