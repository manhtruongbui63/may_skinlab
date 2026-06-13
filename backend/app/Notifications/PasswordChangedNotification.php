<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

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
     * Build the mail representation: a security alert that the password changed.
     *
     * @param User $notifiable
     * @return MailMessage
     */
    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject(trans('auth.reset.changed_mail.subject'))
            ->greeting(trans('auth.reset.changed_mail.greeting', ['name' => $notifiable->name]))
            ->line(trans('auth.reset.changed_mail.intro', ['datetime' => now()->toDayDateTimeString()]))
            ->line(trans('auth.reset.changed_mail.warning'));
    }
}
