<?php

namespace App\Services\Ia;

use RuntimeException;
use Throwable;

class TieredIaService
{
    /** @param IaProviderContract[] $providers */
    public function __construct(private array $providers)
    {
    }

    public function analyze(array $payload): IaResponse
    {
        $exceptions = [];

        foreach ($this->providers as $provider) {
            try {
                return $provider->analyze($payload);
            } catch (Throwable $exception) {
                $exceptions[] = $exception->getMessage();
            }
        }

        throw new RuntimeException('Nenhum provedor IA disponÃƒÂ­vel: ' . implode(' | ', $exceptions));
    }
}
