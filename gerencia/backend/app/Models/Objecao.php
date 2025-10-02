<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Objecao extends Model
{
    use HasFactory;

    protected $table = 'objecao';
    protected $primaryKey = 'obj_id';

    protected $fillable = [
        'obj_ctaid',
        'obj_nome',
        'obj_tipo',
        'obj_ativo'
    ];

    protected $casts = [
        'obj_ativo' => 'boolean'
    ];

    public function conta(): BelongsTo
    {
        return $this->belongsTo(Conta::class, 'obj_ctaid', 'cta_id');
    }
}
