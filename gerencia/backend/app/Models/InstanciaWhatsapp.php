<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstanciaWhatsapp extends Model
{
    use HasFactory;

    protected $table = 'instancia_whatsapp';
    protected $primaryKey = 'iwh_id';

    protected $fillable = [
        'iwh_ctaid',
        'iwh_nome',
        'iwh_status',
        'iwh_api_key',
        'iwh_webhook_token',
        'iwh_metadata'
    ];

    protected $casts = [
        'iwh_metadata' => 'array'
    ];

    public function conta(): BelongsTo
    {
        return $this->belongsTo(Conta::class, 'iwh_ctaid', 'cta_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'led_iwhid', 'iwh_id');
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(Mensagem::class, 'msg_iwhid', 'iwh_id');
    }
}
