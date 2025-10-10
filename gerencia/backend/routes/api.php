<?php

use App\Http\Controllers\Admin\SuperAdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstanciaWhatsappController;
use App\Http\Controllers\KanbanController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ObjecaoController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\Webhook\EvolutionWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('webhook/evolution', EvolutionWebhookController::class);

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::put('auth/password', [AuthController::class, 'updatePassword']);

    Route::get('dashboard', DashboardController::class);

    Route::get('leads', [LeadController::class, 'index']);
    Route::get('leads/{lead}', [LeadController::class, 'show']);
    Route::match(['put', 'patch'], 'leads/{lead}', [LeadController::class, 'update']);
    Route::post('leads/{lead}/status', [LeadController::class, 'changeStatus']);

    Route::post('kanban/{lead}/move', [KanbanController::class, 'move']);

    Route::get('instancias', [InstanciaWhatsappController::class, 'index']);
    Route::get('usuarios/opcoes', [UsuarioController::class, 'options']);
    Route::middleware('admin')->group(function () {
        Route::get('usuarios', [UsuarioController::class, 'index']);
        Route::post('usuarios', [UsuarioController::class, 'store']);
        Route::match(['put', 'patch'], 'usuarios/{usuario}', [UsuarioController::class, 'update']);
        Route::delete('usuarios/{usuario}', [UsuarioController::class, 'destroy']);

        Route::post('instancias', [InstanciaWhatsappController::class, 'store']);
        Route::put('instancias/{instancia}', [InstanciaWhatsappController::class, 'update']);
        Route::delete('instancias/{instancia}', [InstanciaWhatsappController::class, 'destroy']);
        Route::post('instancias/{instancia}/connect', [InstanciaWhatsappController::class, 'connect']);
        Route::post('instancias/{instancia}/webhook/sync', [InstanciaWhatsappController::class, 'syncWebhook']);
        Route::post('instancias/{instancia}/refresh', [InstanciaWhatsappController::class, 'refresh']);
        Route::post('instancias/{instancia}/test', [InstanciaWhatsappController::class, 'testConnection']);
    });

    Route::get('objecoes', [ObjecaoController::class, 'index']);
    Route::post('objecoes', [ObjecaoController::class, 'store']);
    Route::put('objecoes/{objecao}', [ObjecaoController::class, 'update']);

    Route::prefix('admin')->middleware('superadmin')->group(function () {
        Route::get('overview', [SuperAdminController::class, 'overview']);
        Route::get('contas', [SuperAdminController::class, 'contas']);
        Route::post('contas', [SuperAdminController::class, 'storeConta']);
        Route::match(['put', 'patch'], 'contas/{conta}', [SuperAdminController::class, 'updateConta']);
        Route::delete('contas/{conta}', [SuperAdminController::class, 'deleteConta']);
        Route::post('contas/{conta}/usuarios', [SuperAdminController::class, 'criarUsuario']);
        Route::patch('contas/{conta}/retencao', [SuperAdminController::class, 'atualizarRetencao']);
        Route::get('contas/{conta}/logs', [SuperAdminController::class, 'logs']);
        Route::get('settings/evolution', [SuperAdminController::class, 'evolutionConfig']);
        Route::put('settings/evolution', [SuperAdminController::class, 'updateEvolutionConfig']);
    });
});





