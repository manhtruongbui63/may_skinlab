<?php

declare(strict_types=1);

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum VisitStatusEnum: int
{
    use HasEnumStaticMethods;

    case WAITING = 1;
    case IN_PROGRESS = 2;
    case COMPLETED = 3;
    case CANCELLED = 4;

    /**
     * Allowed state transitions.
     * Used by VisitService to validate status changes.
     *
     * @var array<int, list<self>>
     */
    public const ALLOWED_TRANSITIONS = [
        self::WAITING->value => [self::IN_PROGRESS, self::CANCELLED],
        self::IN_PROGRESS->value => [self::COMPLETED, self::CANCELLED],
        self::COMPLETED->value => [],
        self::CANCELLED->value => [],
    ];

    public function label(): string
    {
        return match ($this) {
            self::WAITING => trans('enums.visit_status.waiting'),
            self::IN_PROGRESS => trans('enums.visit_status.in_progress'),
            self::COMPLETED => trans('enums.visit_status.completed'),
            self::CANCELLED => trans('enums.visit_status.cancelled'),
        };
    }

    /**
     * Get the allowed next statuses from the current status.
     *
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return self::ALLOWED_TRANSITIONS[$this->value] ?? [];
    }

    /**
     * Determine if transitioning to a given status is allowed.
     */
    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }
}
