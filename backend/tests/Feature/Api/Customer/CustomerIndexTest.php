<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Customer;

use App\Enums\CustomerStatusEnum;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Customer List API (GET /api/customers).
 */
class CustomerIndexTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
    }

    /**
     * Test Case 1: Authenticated user can list customers.
     */
    public function test_authenticated_user_can_list_customers(): void
    {
        // Arrange
        Customer::factory()->count(5)->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers');

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'errors',
                'data' => [
                    '*' => [
                        'id',
                        'full_name',
                        'phone',
                        'birth_date',
                        'gender' => ['value', 'label'],
                        'address',
                        'source' => ['value', 'label'],
                        'status' => ['value', 'label'],
                        'outstanding_amount',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }

    /**
     * Test Case 2: Guest cannot list customers.
     */
    public function test_guest_cannot_list_customers(): void
    {
        // Act
        $response = $this->getJson('/api/customers');

        // Assert
        $response->assertStatus(401);
    }

    /**
     * Test Case 3: List supports search by name.
     */
    public function test_list_supports_search_by_name(): void
    {
        // Arrange
        Customer::factory()->create(['full_name' => 'Nguyễn Văn A']);
        Customer::factory()->create(['full_name' => 'Trần Văn B']);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers?search=Nguyễn');

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.0.full_name', 'Nguyễn Văn A')
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test Case 4: List supports search by phone.
     */
    public function test_list_supports_search_by_phone(): void
    {
        // Arrange
        Customer::factory()->create(['phone' => '0901234567']);
        Customer::factory()->create(['phone' => '0912345678']);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers?search=0901');

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.0.phone', '0901234567')
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test Case 5: List supports filter by province.
     */
    public function test_list_supports_filter_by_province(): void
    {
        // Arrange
        $province1 = \Illuminate\Support\Facades\DB::table('provinces')->insertGetId(['name' => 'Province A']);
        $province2 = \Illuminate\Support\Facades\DB::table('provinces')->insertGetId(['name' => 'Province B']);
        Customer::factory()->create(['province_id' => $province1]);
        Customer::factory()->create(['province_id' => $province2]);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers?province_id=' . $province1);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.0.province.id', $province1)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test Case 6: List supports filter by status.
     */
    public function test_list_supports_filter_by_status(): void
    {
        // Arrange
        Customer::factory()->create(['status' => CustomerStatusEnum::ACTIVE->value]);
        Customer::factory()->inactive()->create(['status' => CustomerStatusEnum::INACTIVE->value]);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers?status=' . CustomerStatusEnum::INACTIVE->value);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.0.status.value', CustomerStatusEnum::INACTIVE->value)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test Case 7: List returns paginated response.
     */
    public function test_list_returns_paginated_response(): void
    {
        // Arrange
        Customer::factory()->count(15)->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers?per_page=10');

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 15)
            ->assertJsonCount(10, 'data');
    }

    /**
     * Test Case 8: List returns empty array when no customers.
     */
    public function test_list_returns_empty_array_when_no_customers(): void
    {
        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers');

        // Assert
        $response->assertStatus(200)
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }
}
