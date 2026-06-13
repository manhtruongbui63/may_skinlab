<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Customer;

use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Customer Delete API (DELETE /api/customers/{id}).
 */
class CustomerDestroyTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
    }

    /**
     * Test Case 1: Authenticated user can delete customer.
     */
    public function test_authenticated_user_can_delete_customer(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(204);
    }

    /**
     * Test Case 2: Guest cannot delete customer.
     */
    public function test_guest_cannot_delete_customer(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->deleteJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(401);
    }

    /**
     * Test Case 3: Delete fails when customer not found.
     */
    public function test_destroy_fails_when_customer_not_found(): void
    {
        // Act
        $response = $this->actingAs($this->user, 'api')
            ->deleteJson('/api/customers/99999');

        // Assert
        $response->assertStatus(404);
    }

    /**
     * Test Case 4: Delete performs soft delete.
     */
    public function test_destroy_performs_soft_delete(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(204);

        // Soft delete: record exists but has deleted_at
        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
        ]);

        $this->assertTrue(
            Customer::withTrashed()->find($customer->id)->trashed(),
        );
    }

    /**
     * Test Case 5: Delete removes customer from list.
     * PROPOSED_BR:customer-status-active (soft delete)
     */
    public function test_destroy_removes_customer_from_list(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act - delete
        $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert - not in list
        $listResponse = $this->actingAs($this->user, 'api')
            ->getJson('/api/customers');

        $listResponse->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    /**
     * Test Case 6: Delete creates activity log (BR-G002).
     */
    public function test_destroy_creates_activity_log(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(204);

        $this->assertDatabaseHas('activity_log', [
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'causer_id' => $this->user->id,
        ]);
    }

    /**
     * Test Case 7: Delete returns 204 status.
     */
    public function test_destroy_returns_204_status(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert
        $response->assertStatus(204);
    }

    /**
     * Test Case 8: Deleted customer cannot be shown.
     */
    public function test_deleted_customer_cannot_be_shown(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act - delete
        $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert - show returns 404
        $showResponse = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$customer->id}");

        $showResponse->assertStatus(404);
    }

    /**
     * Test Case 9: Deleted customer cannot be updated.
     */
    public function test_deleted_customer_cannot_be_updated(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act - delete
        $this->actingAs($this->user, 'api')
            ->deleteJson("/api/customers/{$customer->id}");

        // Assert - update returns 404
        $updateResponse = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'full_name' => 'New Name',
            ]);

        $updateResponse->assertStatus(404);
    }
}
