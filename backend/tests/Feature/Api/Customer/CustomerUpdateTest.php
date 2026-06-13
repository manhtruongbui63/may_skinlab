<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Customer;

use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Customer Update API (PATCH /api/customers/{id}).
 */
class CustomerUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
    }

    /**
     * Test Case 1: Authenticated user can update customer.
     */
    public function test_authenticated_user_can_update_customer(): void
    {
        // Arrange
        $customer = Customer::factory()->create(['full_name' => 'Old Name']);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'full_name' => 'New Name',
            ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.full_name', 'New Name');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'full_name' => 'New Name',
        ]);
    }

    /**
     * Test Case 2: Guest cannot update customer.
     */
    public function test_guest_cannot_update_customer(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->patchJson("/api/customers/{$customer->id}", [
            'full_name' => 'New Name',
        ]);

        // Assert
        $response->assertStatus(401);
    }

    /**
     * Test Case 3: Update fails when customer not found.
     */
    public function test_update_fails_when_customer_not_found(): void
    {
        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson('/api/customers/99999', [
                'full_name' => 'New Name',
            ]);

        // Assert
        $response->assertStatus(404);
    }

    /**
     * Test Case 4: Update allows same phone for current customer.
     * PROPOSED_BR:customer-unique-phone (ignore self)
     */
    public function test_update_allows_same_phone_for_current_customer(): void
    {
        // Arrange
        $customer = Customer::factory()->create(['phone' => '0901234567']);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'full_name' => 'Updated Name',
                'phone' => '0901234567', // Same phone
            ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.phone', '0901234567');
    }

    /**
     * Test Case 5: Update fails when phone belongs to another customer.
     * PROPOSED_BR:customer-unique-phone
     */
    public function test_update_fails_when_phone_belongs_to_another_customer(): void
    {
        // Arrange
        $existingCustomer = Customer::factory()->create(['phone' => '0901234567']);
        $customer = Customer::factory()->create(['phone' => '0909876543']);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'phone' => '0901234567', // Belongs to existingCustomer
            ]);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.phone.0', trans('validation.custom.phone.unique'));
    }

    /**
     * Test Case 6: Update only changes provided fields.
     */
    public function test_update_only_changes_provided_fields(): void
    {
        // Arrange
        $customer = Customer::factory()->create([
            'full_name' => 'Original Name',
            'phone' => '0901234567',
            'gender' => GenderEnum::MALE->value,
        ]);

        // Act - only update full_name
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'full_name' => 'Updated Name',
            ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.full_name', 'Updated Name')
            ->assertJsonPath('data.phone', '0901234567') // Unchanged
            ->assertJsonPath('data.gender.value', GenderEnum::MALE->value); // Unchanged
    }

    /**
     * Test Case 7: Update creates activity log (BR-G002).
     */
    public function test_update_creates_activity_log(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'full_name' => 'Updated Name',
            ]);

        // Assert
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_log', [
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'causer_id' => $this->user->id,
        ]);
    }

    /**
     * Test Case 8: Update fails when phone format is invalid.
     */
    public function test_update_fails_when_phone_is_invalid(): void
    {
        // Arrange
        $customer = Customer::factory()->create();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'phone' => 'invalid-phone',
            ]);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.phone', fn ($e) => !empty($e));
    }

    /**
     * Test Case 9: Update can change status.
     */
    public function test_update_can_change_status(): void
    {
        // Arrange
        $customer = Customer::factory()->create([
            'status' => CustomerStatusEnum::ACTIVE->value,
        ]);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/customers/{$customer->id}", [
                'status' => CustomerStatusEnum::INACTIVE->value,
            ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.status.value', CustomerStatusEnum::INACTIVE->value);

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'status' => CustomerStatusEnum::INACTIVE->value,
        ]);
    }
}
