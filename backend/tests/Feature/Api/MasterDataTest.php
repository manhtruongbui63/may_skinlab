<?php

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterDataTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
    }

    public function test_can_get_user_statuses(): void
    {
        // Arrange
        $resource = 'user_statuses';

        // Act
        $response = $this->getJson("/api/master-data?resources[{$resource}]={}");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'user_statuses' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ]);
    }

    public function test_can_get_date_formats(): void
    {
        $response = $this->getJson('/api/master-data?resources[date_formats]={}');

        $response->assertStatus(200)
            ->assertJsonPath('data.date_formats.fe_date_format', 'Y-m-d');
    }

    public function test_can_get_genders(): void
    {
        $response = $this->getJson('/api/master-data?resources[genders]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'genders' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ]);
    }

    public function test_authenticated_user_can_get_users(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/master-data?resources[users]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'users' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ]);
    }

    public function test_authenticated_user_can_get_active_users(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/master-data?resources[active_users]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'active_users' => [
                        '*' => ['id', 'name', 'email'],
                    ],
                ],
            ]);
    }

    public function test_guest_cannot_get_users(): void
    {
        $response = $this->getJson('/api/master-data?resources[users]={}');

        $response->assertStatus(200)
            ->assertJsonPath('data.users', null);
    }

    public function test_guest_cannot_get_active_users(): void
    {
        $response = $this->getJson('/api/master-data?resources[active_users]={}');

        $response->assertStatus(200)
            ->assertJsonPath('data.active_users', null);
    }

    public function test_can_get_countries(): void
    {
        $response = $this->getJson('/api/master-data?resources[countries]={}');

        $response->assertStatus(200)
            ->assertJsonPath('data.countries.vn', 'Vietnam');
    }

    public function test_returns_empty_for_unknown_resource(): void
    {
        $response = $this->getJson('/api/master-data?resources[unknown_resource]={}');

        $response->assertStatus(200)
            ->assertExactJson([
                'success' => true,
                'message' => '',
                'errors' => null,
                'data' => [],
            ]);
    }

    public function test_returns_empty_when_no_resources_param(): void
    {
        $response = $this->getJson('/api/master-data');

        $response->assertStatus(200)
            ->assertExactJson([
                'success' => true,
                'message' => '',
                'errors' => null,
                'data' => [],
            ]);
    }

    public function test_can_get_customer_genders(): void
    {
        $response = $this->getJson('/api/master-data?resources[customer_genders]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'customer_genders' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ])
            ->assertJsonCount(3, 'data.customer_genders');
    }

    public function test_can_get_customer_sources(): void
    {
        $response = $this->getJson('/api/master-data?resources[customer_sources]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'customer_sources' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ])
            ->assertJsonCount(5, 'data.customer_sources');
    }

    public function test_can_get_customer_statuses(): void
    {
        $response = $this->getJson('/api/master-data?resources[customer_statuses]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'customer_statuses' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ])
            ->assertJsonCount(2, 'data.customer_statuses');
    }

    public function test_can_get_provinces(): void
    {
        $response = $this->getJson('/api/master-data?resources[provinces]={}');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'provinces' => [
                        '*' => ['id', 'name'],
                    ],
                ],
            ]);
    }

    public function test_can_get_wards_filtered_by_province(): void
    {
        // Gửi không có params
        $response = $this->getJson('/api/master-data?resources[wards]={}');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'wards' => [
                        '*' => ['id', 'province_id', 'name'],
                    ],
                ],
            ]);

        // Gửi có province_id param
        $response2 = $this->getJson('/api/master-data?resources[wards]={"province_id":1}');
        $response2->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'wards' => [
                        '*' => ['id', 'province_id', 'name'],
                    ],
                ],
            ]);
    }
}
