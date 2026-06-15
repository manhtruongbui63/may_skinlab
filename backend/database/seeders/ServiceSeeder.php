<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            ['name' => 'Khám Da Cơ Bản',     'code' => 'SVC01', 'price' => 150000.00,  'is_active' => true],
            ['name' => 'Tư Vấn Da Liễu',      'code' => 'SVC02', 'price' => 200000.00,  'is_active' => true],
            ['name' => 'Laser CO2',            'code' => 'SVC03', 'price' => 1500000.00, 'is_active' => true],
            ['name' => 'Mesotherapy',          'code' => 'SVC04', 'price' => 800000.00,  'is_active' => true],
            ['name' => 'Peel Da Hóa Học',      'code' => 'SVC05', 'price' => 600000.00,  'is_active' => true],
            ['name' => 'Điều Trị Mụn',         'code' => 'SVC06', 'price' => 350000.00,  'is_active' => true],
        ];

        $now = now();

        $records = array_map(function (array $service) use ($now): array {
            return array_merge($service, [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }, $services);

        Service::insert($records);
    }
}
