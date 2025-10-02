<?php

namespace App\Http\Controllers;

use App\Models\Objecao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObjecaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        $objecoes = Objecao::query()
            ->where(function ($q) use ($conta) {
                $q->where('obj_ctaid', $conta->cta_id)
                    ->orWhere(function ($qq) {
                        $qq->whereNull('obj_ctaid')->where('obj_tipo', 'base');
                    });
            })
            ->orderByDesc('obj_ativo')
            ->orderBy('obj_nome')
            ->get();

        return response()->json($objecoes);
    }

    public function store(Request $request): JsonResponse
    {
        $conta = $request->attributes->get('tenant');

        $data = $request->validate([
            'obj_nome' => ['required', 'string', 'max:120']
        ]);

        $objecao = Objecao::firstOrCreate(
            [
                'obj_ctaid' => $conta->cta_id,
                'obj_nome' => $data['obj_nome']
            ],
            [
                'obj_tipo' => 'custom',
                'obj_ativo' => true
            ]
        );

        return response()->json($objecao, 201);
    }

    public function update(Request $request, Objecao $objecao): JsonResponse
    {
        $conta = $request->attributes->get('tenant');
        abort_if($objecao->obj_ctaid !== null && $objecao->obj_ctaid !== $conta->cta_id, 403);

        $data = $request->validate([
            'obj_ativo' => ['required', 'boolean']
        ]);

        $objecao->obj_ativo = $data['obj_ativo'];
        $objecao->save();

        return response()->json($objecao);
    }
}
