<?php

namespace App\Mail;

use App\Models\Usuario;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Usuario $usuario,
        public string $token,
        public string $resetUrl
    ) {
    }

    public function build(): self
    {
        return $this->subject('Recupera??o de senha - ' . config('app.name'))
            ->view('emails.password_reset')
            ->with([
                'usuario' => $this->usuario,
                'token' => $this->token,
                'resetUrl' => $this->resetUrl,
            ]);
    }
}

