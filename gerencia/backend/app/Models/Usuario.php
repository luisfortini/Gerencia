<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuario';
    protected $primaryKey = 'usr_id';

    protected $fillable = [
        'usr_ctaid',
        'usr_nome',
        'usr_email',
        'usr_senha',
        'usr_papel',
        'usr_superadmin',
        'usr_ativo'
    ];

    protected $hidden = [
        'usr_senha',
        'remember_token'
    ];

    protected $casts = [
        'usr_superadmin' => 'boolean',
        'usr_ativo' => 'boolean'
    ];

    public function getAuthPassword(): string
    {
        return $this->usr_senha;
    }

    public function conta(): BelongsTo
    {
        return $this->belongsTo(Conta::class, 'usr_ctaid', 'cta_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'led_responsavel_usrid', 'usr_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(LogStatusLead::class, 'lsl_usrid', 'usr_id');
    }
}
