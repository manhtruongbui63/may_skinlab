<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Customer;

use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Customer Show API (GET /api/customers/{id}).
 */
class CustomerShowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
    }

    /**
     * Test Case 1: Authenticated user can view customer detail.
     */
    public function test_authenticated_user_can_view_customer_detail(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $customer->id)
            ->assertJsonPath('data.full_name', $customer->full_name)
            ->assertJsonPath('data.phone', $customer->phone);
    }

    /**
     * Test Case 2: Guest cannot view customer detail.
     */
    public function test_guest_cannot_view_customer_detail(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->getJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(401);
    }

    /**
     * Test Case 3: Show returns 404 for nonexistent customer.
     */
    public function test_show_returns_404_for_nonexistent_customer(): void
    {
        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers/99999');

        // Assert
        $response->assertStatus(404);
    }

    /**
     * Test Case 4: Show returns customer with enum labels.
     */
    public function test_show_returns_customer_with_enum_labels(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'gender' => ['value', 'label'],
                    'source' => ['value', 'label'],
                    'status' => ['value', 'label'],
                ],
            ]);
    }

    /**
     * Test Case 5: Show returns outstanding amount.
     */
    public function test_show_returns_outstanding_amount(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.outstanding_amount', 0); // No invoices yet
    }
}
