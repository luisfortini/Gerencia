<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FilaJob extends Model
{
    use HasFactory;

    protected $table = 'fila_job';
    protected $primaryKey = 'fjb_id';

    protected $fillable = [
        'fjb_tipo',
        'fjb_status',
        'fjb_tentativas',
        'fjb_payload'
    ];

    protected $casts = [
        'fjb_payload' => 'array'
    ];
}
