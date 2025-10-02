<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mensagem extends Model
{
    use HasFactory;

    protected $table = 'mensagem';
    protected $primaryKey = 'msg_id';

    protected $fillable = [
        'msg_ledid',
        'msg_iwhid',
        'msg_direcao',
        'msg_conteudo',
        'msg_msgid',
        'msg_recebido_em'
    ];

    protected $casts = [
        'msg_recebido_em' => 'datetime'
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'msg_ledid', 'led_id');
    }

    public function instanciaWhatsapp(): BelongsTo
    {
        return $this->belongsTo(InstanciaWhatsapp::class, 'msg_iwhid', 'iwh_id');
    }
}
