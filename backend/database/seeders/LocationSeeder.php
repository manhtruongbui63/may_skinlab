<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Province;
use App\Models\Ward;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            'Thành phố Hà Nội' => [
                'Phường Trúc Bạch',
                'Phường Đống Mác',
                'Phường Hàng Bạc',
            ],
            'Thành phố Hồ Chí Minh' => [
                'Phường Võ Thị Sáu',
                'Phường Đa Kao',
                'Phường Bến Nghé',
            ],
            'Thành phố Đà Nẵng' => [
                'Phường Hải Châu',
                'Phường Nam Dương',
                'Phường Thạch Thang',
            ],
        ];

        foreach ($locations as $provinceName => $wards) {
            $province = Province::create([
                'name' => $provinceName,
            ]);

            foreach ($wards as $wardName) {
                Ward::create([
                    'province_id' => $province->id,
                    'name' => $wardName,
                ]);
            }
        }
    }
}
