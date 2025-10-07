<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    protected $table = 'lead';
    protected $primaryKey = 'led_id';

    protected $fillable = [
        'led_ctaid',
        'led_iwhid',
        'led_responsavel_usrid',
        'led_nome',
        'led_telefone',
        'led_email',
        'led_status',
        'led_status_conf',
        'led_etapa',
        'led_valor_total',
        'led_origem',
        'led_observacoes',
        'led_ultima_atualizacao_ia',
    ];

    protected $casts = [
        'led_status_conf' => 'float',
        'led_ultima_atualizacao_ia' => 'datetime',
    ];

    public function conta(): BelongsTo
    {
        return $this->belongsTo(Conta::class, 'led_ctaid', 'cta_id');
    }

    public function instanciaWhatsapp(): BelongsTo
    {
        return $this->belongsTo(InstanciaWhatsapp::class, 'led_iwhid', 'iwh_id');
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'led_responsavel_usrid', 'usr_id');
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(Mensagem::class, 'msg_ledid', 'led_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(LogStatusLead::class, 'lsl_ledid', 'led_id');
    }

    public function auditoriasIa(): HasMany
    {
        return $this->hasMany(AuditoriaIa::class, 'aia_ledid', 'led_id');
    }

    protected function ledValorTotal(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : (float) $value,
            set: fn ($value) => $value === null ? null : round((float) $value, 2)
        );
    }
}
