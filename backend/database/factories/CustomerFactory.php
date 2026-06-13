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
     * @var class-string\u003cCustomer\u003e
     */
    protected $model = Customer::class;

    /**
     * Define the model's default state.
     *
     * @return array\u003cstring, mixed\u003e
     */
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'phone' => fake()->unique()->phoneNumber(),
            'birth_date' => fake()->optional()->date(),
            'gender' => fake()->optional()->randomElement(GenderEnum::values()),
            'address' => fake()->optional()->address(),
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
