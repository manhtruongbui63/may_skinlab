<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Enums\RegistrationTypeEnum;
use App\Enums\VisitStatusEnum;
use App\Models\ClinicRoom;
use App\Models\Customer;
use App\Models\Service;
use App\Models\ServicePackage;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Tests for Visit Create API (Task 06).
 *
 * Covers: Validation (WALK_IN, SCHEDULED), Code/Queue generation, Auth.
 */
class CreateVisitTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;
    private ClinicRoom $activeRoom;
    private ClinicRoom $inactiveRoom;
    private Service $service;
    private ServicePackage $package;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create();
        $this->activeRoom = ClinicRoom::factory()->create(['is_active' => true]);
        $this->inactiveRoom = ClinicRoom::factory()->create(['is_active' => false]);
        $this->service = Service::factory()->create();
        $this->package = ServicePackage::factory()->create();
    }

    /**
     * Happy Path: Create WALK_IN visit successfully.
     */
    public function test_user_can_create_walk_in_visit_successfully(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => $this->activeRoom->id,
            'service_ids' => [$this->service->id],
            'service_package_ids' => [$this->package->id],
            'is_priority' => true,
            'customer_id' => $this->customer->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', fn ($code) => str_starts_with($code, 'KB'))
            ->assertJsonPath('data.queue_number', 1)
            ->assertJsonPath('data.registration_type.value', RegistrationTypeEnum::WALK_IN->value)
            ->assertJsonPath('data.status.value', VisitStatusEnum::WAITING->value);

        $this->assertDatabaseHas('visits', [
            'clinic_room_id' => $this->activeRoom->id,
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'status' => VisitStatusEnum::WAITING->value,
            'is_priority' => true,
        ]);

        $this->assertDatabaseHas('visit_services', [
            'service_id' => $this->service->id,
        ]);
    }

    /**
     * Happy Path: Create SCHEDULED visit successfully.
     */
    public function test_user_can_create_scheduled_visit_successfully(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
            'appointment_date' => now()->addDay()->format('Y-m-d'),
            'customer_id' => $this->customer->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.registration_type.value', RegistrationTypeEnum::SCHEDULED->value);

        $this->assertDatabaseHas('visits', [
            'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
        ]);
    }

    /**
     * Validation: WALK_IN requires clinic_room_id.
     */
    public function test_walk_in_requires_clinic_room_id(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'service_ids' => [$this->service->id],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.clinic_room_id', fn ($e) => !empty($e));
    }

    /**
     * Validation: WALK_IN requires service_ids.
     */
    public function test_walk_in_requires_service_ids(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => $this->activeRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.service_ids', fn ($e) => !empty($e));
    }

    /**
     * Validation: clinic_room_id must exist.
     */
    public function test_clinic_room_id_must_exist(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => 99999,
            'service_ids' => [$this->service->id],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.clinic_room_id', fn ($e) => !empty($e));
    }

    /**
     * Validation: clinic_room_id must be active.
     */
    public function test_clinic_room_id_must_be_active(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => $this->inactiveRoom->id,
            'service_ids' => [$this->service->id],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.clinic_room_id', fn ($e) => !empty($e));
    }

    /**
     * Validation: service_ids must contain valid service IDs.
     */
    public function test_service_ids_must_contain_valid_service_ids(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => $this->activeRoom->id,
            'service_ids' => [99999],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.service_ids', fn ($e) => !empty($e));
    }

    /**
     * Validation: SCHEDULED requires future appointment_date.
     */
    public function test_scheduled_requires_future_appointment_date(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
            'appointment_date' => now()->format('Y-m-d'),
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.appointment_date', fn ($e) => !empty($e));
    }

    /**
     * Validation: SCHEDULED with past date fails.
     */
    public function test_scheduled_with_past_date_fails(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
            'appointment_date' => now()->subDay()->format('Y-m-d'),
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.appointment_date', fn ($e) => !empty($e));
    }

    /**
     * Validation: SCHEDULED with invalid date format fails.
     */
    public function test_scheduled_with_invalid_date_format_fails(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
            'appointment_date' => 'invalid-date',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.appointment_date', fn ($e) => !empty($e));
    }

    /**
     * Validation: SCHEDULED without appointment_date fails.
     */
    public function test_scheduled_without_appointment_date_fails(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.appointment_date', fn ($e) => !empty($e));
    }

    /**
     * Code Generation: code follows format KByyMMdd-NNNN.
     */
    public function test_visit_code_follows_daily_sequence_format(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => $this->activeRoom->id,
            'service_ids' => [$this->service->id],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', $payload);

        $response->assertStatus(201);
        $code = $response->json('data.code');

        $today = now()->format('ymd');
        $this->assertMatchesRegularExpression("/^{$today}-\\d{4}$/", $code);
    }

    /**
     * Queue Number: increments per day per room.
     */
    public function test_queue_number_increments_per_day_per_room(): void
    {
        // Create first visit
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', [
                'registration_type' => RegistrationTypeEnum::WALK_IN->value,
                'clinic_room_id' => $this->activeRoom->id,
                'service_ids' => [$this->service->id],
            ]);

        // Create second visit in same room
        $response2 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', [
                'registration_type' => RegistrationTypeEnum::WALK_IN->value,
                'clinic_room_id' => $this->activeRoom->id,
                'service_ids' => [$this->service->id],
            ]);

        $response2->assertStatus(201)
            ->assertJsonPath('data.queue_number', 2);
    }

    /**
     * Queue Number: resets for different room.
     */
    public function test_queue_number_resets_for_different_room(): void
    {
        $room2 = ClinicRoom::factory()->create(['is_active' => true]);

        // Create visit in room 1
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', [
                'registration_type' => RegistrationTypeEnum::WALK_IN->value,
                'clinic_room_id' => $this->activeRoom->id,
                'service_ids' => [$this->service->id],
            ]);

        // Create visit in room 2 - should have queue_number = 1
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits', [
                'registration_type' => RegistrationTypeEnum::WALK_IN->value,
                'clinic_room_id' => $room2->id,
                'service_ids' => [$this->service->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.queue_number', 1);
    }

    /**
     * Auth: Unauthenticated user gets 401.
     */
    public function test_unauthenticated_user_cannot_create_visit(): void
    {
        $payload = [
            'registration_type' => RegistrationTypeEnum::WALK_IN->value,
            'clinic_room_id' => $this->activeRoom->id,
            'service_ids' => [$this->service->id],
        ];

        $response = $this->postJson('/api/v1/visits', $payload);

        $response->assertStatus(401);
    }
}
