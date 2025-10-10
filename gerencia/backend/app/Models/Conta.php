<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conta extends Model
{
    use HasFactory;

    protected $table = 'conta';
    protected $primaryKey = 'cta_id';

    protected $fillable = [
        'cta_nome',
        'cta_slug',
        'cta_plano_tipo',
        'cta_limite_instancias',
        'cta_limite_usuarios',
        'cta_retencao_dias',
        'cta_status',
        'cta_observacoes'
    ];

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'usr_ctaid', 'cta_id');
    }

    public function instanciasWhatsapp(): HasMany
    {
        return $this->hasMany(InstanciaWhatsapp::class, 'iwh_ctaid', 'cta_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'led_ctaid', 'cta_id');
    }

    public function objecoes(): HasMany
    {
        return $this->hasMany(Objecao::class, 'obj_ctaid', 'cta_id');
    }

    public function gestores(): HasMany
    {
        return $this->usuarios()->where('usr_papel', 'gestor');
    }
}
