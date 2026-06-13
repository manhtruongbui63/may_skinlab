<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AppointmentStatusEnum;
use App\Models\Appointment;
use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create active customers
        $customers = Customer::active()->take(5)->get();
        if ($customers->isEmpty()) {
            $customers = Customer::factory()->count(5)->active()->create();
        }

        $today = Carbon::today();

        // Create appointments for active customers
        foreach ($customers as $index => $customer) {
            // Appointment 1: Today
            Appointment::factory()->create([
                'customer_id' => $customer->id,
                'appointment_at' => $today->copy()->setTime(9 + $index, 0, 0),
                'appointment_date' => $today->format('Y-m-d'),
                'status' => AppointmentStatusEnum::CONFIRMED,
            ]);

            // Appointment 2: Tomorrow
            Appointment::factory()->create([
                'customer_id' => $customer->id,
                'appointment_at' => $today->copy()->addDay()->setTime(10 + $index, 30, 0),
                'appointment_date' => $today->copy()->addDay()->format('Y-m-d'),
                'status' => AppointmentStatusEnum::BOOKED,
            ]);
        }
    }
}
