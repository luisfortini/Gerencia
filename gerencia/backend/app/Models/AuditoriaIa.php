<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditoriaIa extends Model
{
    use HasFactory;

    protected $table = 'auditoria_ia';
    protected $primaryKey = 'aia_id';

    protected $fillable = [
        'aia_ledid',
        'aia_payload',
        'aia_resposta',
        'aia_provider',
        'aia_status'
    ];

    protected $casts = [
        'aia_payload' => 'array',
        'aia_resposta' => 'array'
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'aia_ledid', 'led_id');
    }
}
