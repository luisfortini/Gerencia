<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Recuperação de senha</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12); overflow: hidden;">
      <tr>
        <td style="padding: 32px;">
          <h1 style="font-size: 20px; margin: 0 0 16px; color: #111827;">Olá, {{ $usuario->usr_nome }}!</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 16px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no <strong>{{ config('app.name') }}</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 24px;">
            Clique no botão abaixo para criar uma nova senha. Por segurança, este link expira em 60 minutos.
          </p>
          <p style="text-align: center; margin: 0 0 24px;">
            <a
              href="{{ $resetUrl }}"
              style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600;"
            >
              Redefinir senha
            </a>
          </p>
          <p style="font-size: 12px; line-height: 1.5; color: #6b7280; margin: 0 0 16px;">
            Se preferir, copie e cole o link abaixo no seu navegador:
            <br />
            <a href="{{ $resetUrl }}" style="color: #2563eb; word-break: break-all;">{{ $resetUrl }}</a>
          </p>
          <p style="font-size: 12px; line-height: 1.5; color: #6b7280; margin: 0 0 16px;">
            Caso você não tenha solicitado esta alteração, ignore este e-mail. Nenhuma ação adicional é necessária.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; margin: 0;">
            Atenciosamente,<br />Equipe {{ config('app.name') }}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
