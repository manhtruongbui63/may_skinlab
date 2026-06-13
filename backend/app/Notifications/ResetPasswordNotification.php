<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of minutes the reset link stays valid.
     */
    public const EXPIRES_MINUTES = 60;

    /**
     * @param string $token Plaintext reset token (never stored as-is).
     */
    public function __construct(
        private readonly string $token,
    ) {
    }

    /**
     * The delivery channels.
     *
     * @param User $notifiable
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation.
     *
     * @param User $notifiable
     * @return MailMessage
     */
    public function toMail(User $notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl($notifiable);

        return (new MailMessage())
            ->subject(trans('auth.reset.mail.subject'))
            ->greeting(trans('auth.reset.mail.greeting', ['name' => $notifiable->name]))
            ->line(trans('auth.reset.mail.intro'))
            ->action(trans('auth.reset.mail.action'), $resetUrl)
            ->line(trans('auth.reset.mail.expires', ['minutes' => self::EXPIRES_MINUTES]))
            ->line(trans('auth.reset.mail.outro'));
    }

    /**
     * Build the frontend reset URL carrying the plaintext token and email.
     *
     * @param User $notifiable
     * @return string
     */
    private function resetUrl(User $notifiable): string
    {
        $query = http_build_query([
            'token' => $this->token,
            'email' => $notifiable->email,
        ]);

        return rtrim(config('app.frontend_url'), '/') . '/reset-password?' . $query;
    }
}
