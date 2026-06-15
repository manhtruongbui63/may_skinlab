<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
            LocationSeeder::class,
            ClinicRoomSeeder::class,
            ServiceSeeder::class,
            ServicePackageSeeder::class,
            AppointmentSeeder::class,
        ]);
    }
}
