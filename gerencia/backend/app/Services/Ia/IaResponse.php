<?php

namespace App\Services\Ia;

class IaResponse
{
    public function __construct(
        public readonly string $status,
        public readonly float $statusConfidence,
        public readonly ?float $valorTotal,
        public readonly ?string $objecao,
        public readonly array $detalhes
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            status: $data['status'] ?? 'novo',
            statusConfidence: (float) ($data['status_conf'] ?? 0.0),
            valorTotal: isset($data['valor_total']) ? (float) $data['valor_total'] : null,
            objecao: $data['objecao'] ?? null,
            detalhes: $data['detalhes'] ?? []
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
        ];
    }
}
