<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogStatusLead extends Model
{
    use HasFactory;

    protected $table = 'log_status_lead';
    protected $primaryKey = 'lsl_id';

    protected $fillable = [
        'lsl_ledid',
        'lsl_status_anterior',
        'lsl_status_novo',
        'lsl_origem',
        'lsl_motivo',
        'lsl_usrid'
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lsl_ledid', 'led_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'lsl_usrid', 'usr_id');
    }
}
