<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ServicePackage;
use Illuminate\Database\Seeder;

class ServicePackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            ['name' => 'Gói Cơ Bản',    'code' => 'PKG01', 'price' => 500000.00,  'is_active' => true],
            ['name' => 'Gói Nâng Cao',   'code' => 'PKG02', 'price' => 1200000.00, 'is_active' => true],
            ['name' => 'Gói Cao Cấp',    'code' => 'PKG03', 'price' => 2500000.00, 'is_active' => true],
            ['name' => 'Gói Trọn Gói',   'code' => 'PKG04', 'price' => 4000000.00, 'is_active' => true],
        ];

        $now = now();

        $records = array_map(function (array $package) use ($now): array {
            return array_merge($package, [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }, $packages);

        ServicePackage::insert($records);
    }
}
