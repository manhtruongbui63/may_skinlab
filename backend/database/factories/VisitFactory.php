<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\RegistrationTypeEnum;
use App\Enums\VisitStatusEnum;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Visit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Visit>
 */
class VisitFactory extends Factory
{
    /**
     * The model the factory corresponds to.
     *
     * @var class-string<Visit>
     */
    protected $model = Visit::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->regexify('KB\d{6}-\d{4}'),
            'queue_number' => fake()->numberBetween(1, 50),
            'customer_id' => Customer::factory(),
            'appointment_id' => null,
            'clinic_room_id' => null,
            'registration_type' => RegistrationTypeEnum::WALK_IN,
            'status' => VisitStatusEnum::WAITING,
            'is_priority' => false,
            'visited_at' => now(),
            'appointment_date' => null,
            'reason' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate the visit is a scheduled appointment.
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'registration_type' => RegistrationTypeEnum::SCHEDULED,
            'appointment_date' => fake()->dateTimeBetween('now', '+7 days')->format('Y-m-d'),
        ]);
    }

    /**
     * Indicate the visit is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisitStatusEnum::IN_PROGRESS,
        ]);
    }

    /**
     * Indicate the visit is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisitStatusEnum::COMPLETED,
        ]);
    }

    /**
     * Indicate the visit is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VisitStatusEnum::CANCELLED,
        ]);
    }

    /**
     * Assign the visit to a specific customer.
     */
    public function withCustomer(int $customerId): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => $customerId,
        ]);
    }

    /**
     * Assign the visit to a specific appointment.
     */
    public function withAppointment(int $appointmentId): static
    {
        return $this->state(fn (array $attributes) => [
            'appointment_id' => $appointmentId,
            'registration_type' => RegistrationTypeEnum::SCHEDULED,
        ]);
    }

    /**
     * Mark the visit as priority.
     */
    public function priority(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_priority' => true,
        ]);
    }
}
