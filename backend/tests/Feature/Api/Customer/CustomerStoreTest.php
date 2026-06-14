<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Customer;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Customer Create API (POST /api/customers).
 */
class CustomerStoreTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
    }

    /**
     * Valid payload helper.
     */
    private function validPayload(): array
    {
        return [
            'full_name' => 'Nguyễn Văn A',
            'phone' => '0901234567',
            'birth_date' => '1990-01-01',
            'gender' => GenderEnum::MALE->value,
            'address' => '123 ABC Street',
            'source' => CustomerSourceEnum::FACEBOOK->value,
            'status' => CustomerStatusEnum::ACTIVE->value,
        ];
    }

    /**
     * Test Case 1: Authenticated user can create customer.
     */
    public function test_authenticated_user_can_create_customer(): void
    {
        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $this->validPayload());

        // Assert
        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.full_name', 'Nguyễn Văn A')
            ->assertJsonPath('data.phone', '0901234567');

        $this->assertDatabaseHas('customers', [
            'full_name' => 'Nguyễn Văn A',
            'phone' => '0901234567',
        ]);
    }

    /**
     * Test Case 2: Guest cannot create customer.
     */
    public function test_guest_cannot_create_customer(): void
    {
        // Act
        $response = $this->postJson('/api/customers', $this->validPayload());

        // Assert
        $response->assertStatus(401);
    }

    /**
     * Test Case 3: Store fails when required fields are missing.
     * Grouped validation: full_name and phone are both required.
     */
    public function test_store_fails_when_required_fields_are_missing(): void
    {
        // Arrange
        $payload = [];

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.full_name', fn ($e) => !empty($e))
            ->assertJsonPath('errors.phone', fn ($e) => !empty($e));
    }

    /**
     * Test Case 4: Store fails when phone is invalid.
     */
    public function test_store_fails_when_phone_is_invalid(): void
    {
        // Arrange
        $payload = $this->validPayload();
        $payload['phone'] = 'invalid-phone';

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.phone', fn ($e) => !empty($e));
    }

    /**
     * Test Case 5: Store fails when phone already exists.
     * PROPOSED_BR:customer-unique-phone
     */
    public function test_store_fails_when_phone_already_exists(): void
    {
        // Arrange
        Customer::factory()->create(['phone' => '0901234567']);
        $payload = $this->validPayload();

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.phone.0', trans('validation.custom.phone.unique'));
    }

    /**
     * Test Case 6: Store fails when string fields exceed max length.
     * Grouped validation: full_name (>255), phone (>50)
     */
    public function test_store_fails_when_string_fields_exceed_max_length(): void
    {
        // Arrange
        $payload = $this->validPayload();
        $payload['full_name'] = str_repeat('A', 256); // max:255 + 1
        $payload['phone'] = str_repeat('0', 51);     // max:50 + 1

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.full_name', fn ($e) => !empty($e))
            ->assertJsonPath('errors.phone', fn ($e) => !empty($e));
    }

    /**
     * Test Case 7: Store fails when enum values are invalid.
     * Grouped validation: gender, source, status
     */
    public function test_store_fails_when_enum_values_are_invalid(): void
    {
        // Arrange
        $payload = $this->validPayload();
        $payload['gender'] = 99;  // Invalid
        $payload['source'] = 99;  // Invalid
        $payload['status'] = 99;  // Invalid

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.gender', fn ($e) => !empty($e))
            ->assertJsonPath('errors.source', fn ($e) => !empty($e))
            ->assertJsonPath('errors.status', fn ($e) => !empty($e));
    }

    /**
     * Test Case 8: Store fails when birth_date format is invalid.
     */
    public function test_store_fails_when_birth_date_format_is_invalid(): void
    {
        // Arrange
        $payload = $this->validPayload();
        $payload['birth_date'] = 'invalid-date';

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonPath('errors.birth_date', fn ($e) => !empty($e));
    }

    /**
     * Test Case 9: Store creates activity log (BR-G002).
     */
    public function test_store_creates_activity_log(): void
    {
        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $this->validPayload());

        // Assert
        $response->assertStatus(201);

        $customer = Customer::first();
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'causer_id' => $this->user->id,
        ]);
    }

    /**
     * Test Case 10: Store uses default values for optional fields.
     */
    public function test_store_uses_default_values_for_optional_fields(): void
    {
        // Arrange - only required fields
        $payload = [
            'full_name' => 'Nguyễn Văn B',
            'phone' => '0909876543',
        ];

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(201)
            ->assertJsonPath('data.source.value', CustomerSourceEnum::OTHER->value)
            ->assertJsonPath('data.status.value', CustomerStatusEnum::ACTIVE->value);

        $this->assertDatabaseHas('customers', [
            'source' => CustomerSourceEnum::OTHER->value,
            'status' => CustomerStatusEnum::ACTIVE->value,
        ]);
    }

    /**
     * Test Case 11: Auto sequential code generation.
     */
    public function test_store_generates_sequential_code(): void
    {
        // Act
        $response1 = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', [
                'full_name' => 'Customer One',
                'phone' => '0901111111',
            ]);

        $response2 = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', [
                'full_name' => 'Customer Two',
                'phone' => '0902222222',
            ]);

        // Assert
        $response1->assertStatus(201);
        $response2->assertStatus(201);

        $code1 = $response1->json('data.code');
        $code2 = $response2->json('data.code');

        $this->assertMatchesRegularExpression('/^BN\d{6}$/', $code1);
        $this->assertMatchesRegularExpression('/^BN\d{6}$/', $code2);

        $num1 = (int) substr($code1, 2);
        $num2 = (int) substr($code2, 2);

        $this->assertEquals($num1 + 1, $num2);
    }

    /**
     * Test Case 12: Customer age calculation.
     */
    public function test_store_calculates_correct_age(): void
    {
        // Arrange
        $payload = $this->validPayload();
        $payload['birth_date'] = '1995-10-12';

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $expectedAge = now()->year - 1995;
        $response->assertStatus(201)
            ->assertJsonPath('data.age', $expectedAge);
    }

    /**
     * Test Case 13: Auto address resolution when not manually edited.
     */
    public function test_store_resolves_address_automatically(): void
    {
        // Arrange
        $province = \App\Models\Province::create(['name' => 'Thành phố Hà Nội', 'code' => '01']);
        $ward = \App\Models\Ward::create(['province_id' => $province->id, 'name' => 'Phường Dịch Vọng', 'code' => '001']);

        $payload = $this->validPayload();
        $payload['house_number'] = 'Số 10';
        $payload['province_id'] = $province->id;
        $payload['ward_id'] = $ward->id;
        $payload['is_address_manually_edited'] = false;
        unset($payload['address']);

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(201);
        $this->assertDatabaseHas('customers', [
            'id' => $response->json('data.id'),
            'address' => 'Số 10, Phường Dịch Vọng, Thành phố Hà Nội',
        ]);
    }

    /**
     * Test Case 14: Keeps manual address when manual flag is true.
     */
    public function test_store_preserves_manually_edited_address(): void
    {
        // Arrange
        $province = \App\Models\Province::create(['name' => 'Thành phố Hà Nội', 'code' => '01']);
        $ward = \App\Models\Ward::create(['province_id' => $province->id, 'name' => 'Phường Dịch Vọng', 'code' => '001']);

        $payload = $this->validPayload();
        $payload['house_number'] = 'Số 10';
        $payload['province_id'] = $province->id;
        $payload['ward_id'] = $ward->id;
        $payload['is_address_manually_edited'] = true;
        $payload['address'] = 'Địa chỉ nhập tay tự do';

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(201);
        $this->assertDatabaseHas('customers', [
            'id' => $response->json('data.id'),
            'address' => 'Địa chỉ nhập tay tự do',
        ]);
    }

    /**
     * Test Case 15: Cross field validation fails when ward does not belong to province.
     */
    public function test_store_fails_when_ward_does_not_belong_to_province(): void
    {
        // Arrange
        $province1 = \App\Models\Province::create(['name' => 'Tỉnh A', 'code' => '02']);
        $province2 = \App\Models\Province::create(['name' => 'Tỉnh B', 'code' => '03']);
        $ward = \App\Models\Ward::create(['province_id' => $province1->id, 'name' => 'Phường thuộc Tỉnh A', 'code' => '002']);

        $payload = $this->validPayload();
        $payload['province_id'] = $province2->id; // Tỉnh B
        $payload['ward_id'] = $ward->id;    // Phường thuộc Tỉnh A

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/customers', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ward_id'])
            ->assertJsonPath('errors.ward_id.0', trans('validation.ward_not_in_province'));
    }
}
