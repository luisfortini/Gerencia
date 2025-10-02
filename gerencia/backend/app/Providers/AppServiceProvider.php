<?php

namespace App\Providers;

use App\Services\Ia\IaServiceFactory;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(IaServiceFactory::class, fn ($app) => new IaServiceFactory($app));
    }

    public function boot(): void
    {
        //
    }
}
