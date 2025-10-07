<?php

namespace App\Services\Ia;

use Illuminate\Contracts\Container\Container;

class IaServiceFactory
{
    public function __construct(private readonly Container $container)
    {
    }

    public function make(): TieredIaService
    {
        $tier = (int) config('ia.tier', 1);
        $providers = [];
        $openAiKey = config('services.openai.key');

        if ($tier >= 1) {
            $providers[] = new OpenAiIaProvider($openAiKey);
        }

        $providers[] = new MockIaProvider();

        if ($tier <= 0) {
            return new TieredIaService([new MockIaProvider()]);
        }

        return new TieredIaService($providers);
    }
}
