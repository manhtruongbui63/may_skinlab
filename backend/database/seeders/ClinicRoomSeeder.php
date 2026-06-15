<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ClinicRoom;
use Illuminate\Database\Seeder;

class ClinicRoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            ['name' => 'Phòng Da Liễu',   'code' => 'P01', 'is_active' => true],
            ['name' => 'Phòng Tư Vấn',    'code' => 'P02', 'is_active' => true],
            ['name' => 'Phòng Laser',      'code' => 'P03', 'is_active' => true],
            ['name' => 'Phòng Điều Trị',  'code' => 'P04', 'is_active' => true],
            ['name' => 'Phòng VIP',        'code' => 'P05', 'is_active' => true],
        ];

        $now = now();

        $records = array_map(function (array $room) use ($now): array {
            return array_merge($room, [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }, $rooms);

        ClinicRoom::insert($records);
    }
}
