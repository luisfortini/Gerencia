<?php

use App\Http\Controllers\Admin\SuperAdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstanciaWhatsappController;
use App\Http\Controllers\KanbanController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ObjecaoController;
use App\Http\Controllers\Webhook\EvolutionWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login']);
Route::post('webhook/evolution', EvolutionWebhookController::class);

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('dashboard', DashboardController::class);

    Route::get('leads', [LeadController::class, 'index']);
    Route::get('leads/{lead}', [LeadController::class, 'show']);
    Route::put('leads/{lead}', [LeadController::class, 'update']);
    Route::post('leads/{lead}/status', [LeadController::class, 'changeStatus']);

    Route::post('kanban/{lead}/move', [KanbanController::class, 'move']);

    Route::get('instancias', [InstanciaWhatsappController::class, 'index']);
    Route::post('instancias', [InstanciaWhatsappController::class, 'store']);
    Route::put('instancias/{instancia}', [InstanciaWhatsappController::class, 'update']);
    Route::delete('instancias/{instancia}', [InstanciaWhatsappController::class, 'destroy']);
    Route::post('instancias/{instancia}/test', [InstanciaWhatsappController::class, 'testConnection']);

    Route::get('objecoes', [ObjecaoController::class, 'index']);
    Route::post('objecoes', [ObjecaoController::class, 'store']);
    Route::put('objecoes/{objecao}', [ObjecaoController::class, 'update']);

    Route::prefix('admin')->middleware('superadmin')->group(function () {
        Route::get('overview', [SuperAdminController::class, 'overview']);
        Route::get('contas', [SuperAdminController::class, 'contas']);
        Route::post('contas', [SuperAdminController::class, 'storeConta']);
        Route::post('contas/{conta}/usuarios', [SuperAdminController::class, 'criarUsuario']);
        Route::patch('contas/{conta}/retencao', [SuperAdminController::class, 'atualizarRetencao']);
        Route::get('contas/{conta}/logs', [SuperAdminController::class, 'logs']);
    });
});
