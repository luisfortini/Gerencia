<?php

namespace App\Services\Ia;

use Illuminate\Support\Str;

class MockIaProvider implements IaProviderContract
{
    public function analyze(array $payload): IaResponse
    {
        $mensagem = Str::lower($payload['ultima_mensagem'] ?? '');

        $status = 'interessado';
        $statusConf = 0.65;
        $valor = null;
        $objecao = null;

        if (str_contains($mensagem, 'pix') || str_contains($mensagem, 'paguei')) {
            $status = 'ganho';
            $statusConf = 0.92;
            $valor = $payload['valor_estimado'] ?? 0;
        } elseif (str_contains($mensagem, 'caro')) {
            $status = 'negociacao';
            $statusConf = 0.78;
            $objecao = 'preco';
        } elseif (str_contains($mensagem, 'sem tempo')) {
            $status = 'follow_up';
            $statusConf = 0.72;
            $objecao = 'tempo';
        }

        return new IaResponse($status, $statusConf, $valor, $objecao, [
            'provider' => 'mock',
            'observacao' => 'SimulaÃƒÂ§ÃƒÂ£o local'
        ]);
    }
}
