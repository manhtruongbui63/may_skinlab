<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Enums\VisitStatusEnum;
use App\Models\ClinicRoom;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Feature Tests for Visit List, Cancel, Delete APIs (Task 08).
 *
 * Covers: List filters, Cancel state machine, Delete policy.
 */
class VisitListCancelDeleteTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $adminUser;
    private User $managerUser;
    private User $receptionistUser;
    private Customer $customer;
    private ClinicRoom $clinicRoom;
    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::create(['name' => 'admin', 'guard_name' => 'api']);
        Role::create(['name' => 'manager', 'guard_name' => 'api']);
        Role::create(['name' => 'receptionist', 'guard_name' => 'api']);

        // Create users with different roles
        $this->user = User::factory()->create();
        $this->adminUser = User::factory()->create()->assignRole('admin');
        $this->managerUser = User::factory()->create()->assignRole('manager');
        $this->receptionistUser = User::factory()->create()->assignRole('receptionist');

        $this->customer = Customer::factory()->create();
        $this->clinicRoom = ClinicRoom::factory()->create(['is_active' => true]);
        $this->service = Service::factory()->create();
    }

    /**
     * Helper: Create a visit with specific status.
     */
    private function createVisit(string $status = 'WAITING', ?\Carbon\Carbon $visitedAt = null): Visit
    {
        return Visit::factory()->create([
            'customer_id' => $this->customer->id,
            'clinic_room_id' => $this->clinicRoom->id,
            'status' => constant("App\\Enums\\VisitStatusEnum::{$status}")->value,
            'visited_at' => $visitedAt ?? now(),
            'queue_number' => 1,
        ]);
    }

    // ==================== LIST TESTS ====================

    /**
     * List: Default (no filter) returns today's visits.
     */
    public function test_list_default_returns_today_visits(): void
    {
        // Create visit for today
        $visitToday = $this->createVisit('WAITING', now());

        // Create visit for yesterday
        $visitYesterday = Visit::factory()->create([
            'customer_id' => $this->customer->id,
            'clinic_room_id' => $this->clinicRoom->id,
            'status' => VisitStatusEnum::WAITING->value,
            'visited_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/visits');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Should include today's visit
        $response->assertJsonPath('data.0.id', $visitToday->id);
    }

    /**
     * List: Filter with same month dates works.
     */
    public function test_list_filter_same_month_works(): void
    {
        $from = now()->format('Y-m-01');
        $to = now()->format('Y-m-d');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/visits?from={$from}&to={$to}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * List: Filter with different months returns 422.
     */
    public function test_list_filter_different_months_returns_422(): void
    {
        $from = now()->format('Y-m-01');
        $to = now()->addMonth()->format('Y-m-01');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/visits?from={$from}&to={$to}");

        $response->assertStatus(422)
            ->assertJsonPath('errors.from', fn ($e) => !empty($e));
    }

    /**
     * List: Filter with future date returns 422.
     */
    public function test_list_filter_future_date_returns_422(): void
    {
        $to = now()->addDay()->format('Y-m-d');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/visits?to={$to}");

        $response->assertStatus(422)
            ->assertJsonPath('errors.to', fn ($e) => !empty($e));
    }

    /**
     * List: Filter by status works.
     */
    public function test_list_filter_by_status_works(): void
    {
        $this->createVisit('WAITING');
        $this->createVisit('COMPLETED');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/visits?status=' . VisitStatusEnum::WAITING->value);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * List: Pagination meta is included.
     */
    public function test_list_includes_pagination_meta(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/visits');

        $response->assertStatus(200)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', fn ($v) => $v > 0)
            ->assertJsonPath('meta.total', fn ($v) => is_int($v));
    }

    /**
     * Auth: Unauthenticated user cannot list visits.
     */
    public function test_unauthenticated_user_cannot_list_visits(): void
    {
        $response = $this->getJson('/api/v1/visits');
        $response->assertStatus(401);
    }

    // ==================== CANCEL TESTS ====================

    /**
     * Cancel: WAITING visit can be cancelled.
     */
    public function test_can_cancel_waiting_visit(): void
    {
        $visit = $this->createVisit('WAITING');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/visits/{$visit->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status.value', VisitStatusEnum::CANCELLED->value);

        $this->assertDatabaseHas('visits', [
            'id' => $visit->id,
            'status' => VisitStatusEnum::CANCELLED->value,
        ]);
    }

    /**
     * Cancel: IN_PROGRESS visit can be cancelled.
     */
    public function test_can_cancel_in_progress_visit(): void
    {
        $visit = $this->createVisit('IN_PROGRESS');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/visits/{$visit->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('data.status.value', VisitStatusEnum::CANCELLED->value);
    }

    /**
     * Cancel: COMPLETED visit cannot be cancelled.
     */
    public function test_cannot_cancel_completed_visit(): void
    {
        $visit = $this->createVisit('COMPLETED');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/visits/{$visit->id}/cancel");

        $response->assertStatus(422);
    }

    /**
     * Cancel: CANCELLED visit cannot be cancelled again.
     */
    public function test_cannot_cancel_already_cancelled_visit(): void
    {
        $visit = $this->createVisit('CANCELLED');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/visits/{$visit->id}/cancel");

        $response->assertStatus(422);
    }

    /**
     * Cancel: Non-existent visit returns 404.
     */
    public function test_cancel_returns_404_for_non_existent_visit(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson('/api/v1/visits/99999/cancel');

        $response->assertStatus(404);
    }

    /**
     * Auth: Unauthenticated user cannot cancel visit.
     */
    public function test_unauthenticated_user_cannot_cancel_visit(): void
    {
        $visit = $this->createVisit('WAITING');

        $response = $this->patchJson("/api/v1/visits/{$visit->id}/cancel");
        $response->assertStatus(401);
    }

    // ==================== DELETE TESTS ====================

    /**
     * Delete: Admin can delete visit (soft delete).
     */
    public function test_admin_can_delete_visit(): void
    {
        $visit = $this->createVisit('WAITING');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/v1/visits/{$visit->id}");

        $response->assertStatus(204);

        // Verify soft delete
        $this->assertDatabaseHas('visits', ['id' => $visit->id]);
        $this->assertNull(Visit::find($visit->id));
        $this->assertNotNull(Visit::withTrashed()->find($visit->id));
    }

    /**
     * Delete: Manager can delete visit.
     */
    public function test_manager_can_delete_visit(): void
    {
        $visit = $this->createVisit('WAITING');

        $response = $this->actingAs($this->managerUser, 'sanctum')
            ->deleteJson("/api/v1/visits/{$visit->id}");

        $response->assertStatus(204);
    }

    /**
     * Delete: Receptionist cannot delete visit (403).
     */
    public function test_receptionist_cannot_delete_visit(): void
    {
        $visit = $this->createVisit('WAITING');

        $response = $this->actingAs($this->receptionistUser, 'sanctum')
            ->deleteJson("/api/v1/visits/{$visit->id}");

        $response->assertStatus(403);
    }

    /**
     * Delete: Non-existent visit returns 404.
     */
    public function test_delete_returns_404_for_non_existent_visit(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson('/api/v1/visits/99999');

        $response->assertStatus(404);
    }

    /**
     * Auth: Unauthenticated user cannot delete visit.
     */
    public function test_unauthenticated_user_cannot_delete_visit(): void
    {
        $visit = $this->createVisit('WAITING');

        $response = $this->deleteJson("/api/v1/visits/{$visit->id}");
        $response->assertStatus(401);
    }
}
