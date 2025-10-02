<?php

namespace App\Enums;

enum LeadStatus: string
{
    case NOVO = 'novo';
    case QUALIFICADO = 'qualificado';
    case INTERESSADO = 'interessado';
    case NEGOCIACAO = 'negociacao';
    case GANHO = 'ganho';
    case PERDIDO = 'perdido';
    case FOLLOW_UP = 'follow_up';
}
