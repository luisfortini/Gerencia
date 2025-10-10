<?php

namespace App\Services\Ia;

class IaResponse
{
    public function __construct(
        public readonly string $status,
        public readonly float $statusConfidence,
        public readonly ?float $valorTotal,
        public readonly ?string $objecao,
        public readonly array $detalhes,
        public readonly ?int $responsavelId = null,
        public readonly ?string $responsavelNome = null
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            status: $data['status'] ?? 'novo',
            statusConfidence: (float) ($data['status_conf'] ?? 0.0),
            valorTotal: isset($data['valor_total']) ? (float) $data['valor_total'] : null,
            objecao: $data['objecao'] ?? null,
            detalhes: $data['detalhes'] ?? [],
            responsavelId: isset($data['responsavel_id']) && is_numeric($data['responsavel_id'])
                ? (int) $data['responsavel_id']
                : null,
            responsavelNome: isset($data['responsavel_nome']) && is_string($data['responsavel_nome'])
                ? $data['responsavel_nome']
                : null
        );
    }

    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'status_conf' => $this->statusConfidence,
            'valor_total' => $this->valorTotal,
            'objecao' => $this->objecao,
            'detalhes' => $this->detalhes,
            'responsavel_id' => $this->responsavelId,
            'responsavel_nome' => $this->responsavelNome,
        ];
    }
}
