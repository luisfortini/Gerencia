<?php

namespace App\Services\Ia;

interface IaProviderContract
{
    public function analyze(array $payload): IaResponse;
}
