<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
        $adminUser->assignRole('admin');

        $memberUser1 = User::factory()->create([
            'name' => 'Member One',
            'email' => 'member1@example.com',
        ]);
        $memberUser1->assignRole('member');

        $memberUser2 = User::factory()->create([
            'name' => 'Member Two',
            'email' => 'member2@example.com',
        ]);
        $memberUser2->assignRole('member');
    }
}
