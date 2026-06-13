<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AppointmentStatusEnum;
use App\Models\Appointment;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * The model the factory corresponds to.
     *
     * @var class-string<Appointment>
     */
    protected $model = Appointment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $appointmentAt = fake()->dateTimeBetween('now', '+1 month');
        // Round to nearest 30 minutes
        $minutes = (int) $appointmentAt->format('i');
        if ($minutes < 15) {
            $minutes = '00';
        } elseif ($minutes < 45) {
            $minutes = '30';
        } else {
            $minutes = '00';
            $appointmentAt->modify('+1 hour');
        }
        $appointmentAt->setTime((int) $appointmentAt->format('H'), (int) $minutes, 0);

        return [
            'customer_id' => Customer::factory(),
            'appointment_at' => $appointmentAt,
            'appointment_date' => $appointmentAt->format('Y-m-d'),
            'status' => fake()->randomElement(AppointmentStatusEnum::cases()),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
