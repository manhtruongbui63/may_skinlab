<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Customer;

use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Customer Mock endpoints (visits, treatment plans, invoices).
 */
class CustomerMockEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
        $this->customer = Customer::factory()->create();
    }

    /**
     * Test authenticated user can access visits mock.
     */
    public function test_authenticated_user_can_get_mock_visits(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$this->customer->id}/visits");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'customer_id',
                        'visit_date',
                        'doctor_name',
                        'notes',
                        'diagnosis',
                    ],
                ],
            ]);
    }

    /**
     * Test authenticated user can access treatment plans mock.
     */
    public function test_authenticated_user_can_get_mock_treatment_plans(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$this->customer->id}/treatment-plans");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'customer_id',
                        'plan_name',
                        'status',
                        'start_date',
                        'end_date',
                    ],
                ],
            ]);
    }

    /**
     * Test authenticated user can access invoices mock.
     */
    public function test_authenticated_user_can_get_mock_invoices(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/customers/{$this->customer->id}/invoices");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'customer_id',
                        'invoice_number',
                        'amount',
                        'paid_amount',
                        'outstanding_amount',
                        'issue_date',
                        'status',
                    ],
                ],
            ]);
    }

    /**
     * Test guests cannot access mock endpoints.
     */
    public function test_guest_cannot_access_mock_endpoints(): void
    {
        $this->getJson("/api/customers/{$this->customer->id}/visits")->assertStatus(401);
        $this->getJson("/api/customers/{$this->customer->id}/treatment-plans")->assertStatus(401);
        $this->getJson("/api/customers/{$this->customer->id}/invoices")->assertStatus(401);
    }
}
