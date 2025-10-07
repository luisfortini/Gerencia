<?php

namespace App\Services\Ia;

use Illuminate\Support\Str;

class MockIaProvider implements IaProviderContract
{
    public function analyze(array $payload): IaResponse
    {
        $conteudo = $payload['mensagem']['conteudo']
            ?? $payload['ultima_mensagem']
            ?? '';

        $mensagemNormalizada = Str::lower($conteudo);

        $status = 'interessado';
        $statusConf = 0.65;
        $valor = $payload['valor_estimado'] ?? null;
        $objecao = null;

        if (str_contains($mensagemNormalizada, 'pix') || str_contains($mensagemNormalizada, 'paguei')) {
            $status = 'ganho';
            $statusConf = 0.92;
        } elseif (str_contains($mensagemNormalizada, 'caro') || str_contains($mensagemNormalizada, 'preco')) {
            $status = 'negociacao';
            $statusConf = 0.78;
            $objecao = 'preco';
        } elseif (str_contains($mensagemNormalizada, 'sem tempo') || str_contains($mensagemNormalizada, 'depois')) {
            $status = 'follow_up';
            $statusConf = 0.72;
            $objecao = 'tempo';
        }

        return new IaResponse($status, $statusConf, $valor !== null ? (float) $valor : null, $objecao, [
            'provider' => 'mock',
            'observacao' => 'Fallback local',
        ]);
    }
}
