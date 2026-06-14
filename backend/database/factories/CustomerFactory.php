<?php

namespace Database\Factories;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory\u003cCustomer\u003e
 */
class CustomerFactory extends Factory
{
    /**
     * The model the factory corresponds to.
     *
     * @var class-string<Customer>
     */
    protected $model = Customer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $number = null;
        if ($number === null) {
            $maxCode = \Illuminate\Support\Facades\DB::table('customers')->max('code');
            $nextNumber = 1;
            if ($maxCode && preg_match('/^BN(\d+)$/', $maxCode, $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            }
            $number = $nextNumber;
        }

        return [
            'code' => 'BN' . str_pad((string)$number++, 6, '0', STR_PAD_LEFT),
            'full_name' => fake()->name(),
            'phone' => fake()->unique()->phoneNumber(),
            'phone_secondary' => fake()->optional()->phoneNumber(),
            'birth_date' => fake()->optional()->date(),
            'gender' => fake()->optional()->randomElement(GenderEnum::values()),
            'house_number' => fake()->optional()->buildingNumber(),
            'province_id' => null,
            'ward_id' => null,
            'address' => fake()->optional()->address(),
            'is_address_manually_edited' => false,
            'avatar_path' => null,
            'source' => CustomerSourceEnum::random(),
            'status' => CustomerStatusEnum::random(),
        ];
    }

    /**
     * Indicate that the customer is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CustomerStatusEnum::ACTIVE->value,
        ]);
    }

    /**
     * Indicate that the customer is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CustomerStatusEnum::INACTIVE->value,
        ]);
    }
}
