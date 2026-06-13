# Feature Tests Reference

> [!IMPORTANT]
> **Before writing any Feature Test**, you MUST apply ALL of the following techniques:
> 1. **Validation Matrix** — Test every rule type for every field in the FormRequest
> 2. **Equivalence Partitioning (EP)** — One representative value per valid/invalid partition
> 3. **Boundary Value Analysis (BVA)** — Test min-1, min, min+1, max-1, max, max+1
> 4. **Decision Table** — Map all condition combinations for complex business logic
> 5. **State Transition** — Test valid AND invalid status transitions
>
> These are not optional enhancements — they are the baseline for every Feature Test.

**Scope**: Full request cycle — Route → Middleware → FormRequest → Controller → Service → JSON Response.

## When to Use
- Testing HTTP endpoints directly (REST API).
- Verifying Auth guards, middleware behavior, and HTTP status codes.
- Validating JSON response structure and database state changes.
 
> [!IMPORTANT]
> **File Isolation**: Each endpoint/function MUST have its own separate test file (e.g., `CompanyStoreTest.php`). Do NOT combine multiple endpoints into one file.

## Structure Template
```php
namespace Tests\Feature\{Module}\{Feature};

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class {Resource}{Action}Test extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_{module}_can_{action}_successfully(): void
    {
        // Arrange
        $payload = [...];

        // Act
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/{endpoint}', $payload);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('data.field', 'expected_value');

        $this->assertDatabaseHas('table', ['column' => 'value']);
    }
}
```

## Test Design Techniques

Before writing test cases, derive the **expected behaviour from the requirement** (task file, `docs/requirements/`, `docs/logic/`, `docs/system/br-registry.md`, API doc). The requirement is the oracle — it tells you what *should* happen. Read the code only to find exact symbols (field names, route URIs, enum cases), never to decide what is correct:

1. **From the requirement**, list every field, its allowed/forbidden values, validation limits, authorization rules, and edge cases the spec promises.
2. **Read the `FormRequest`'s `rules()` method** only to confirm field names and to spot mismatches — if a rule contradicts the spec, write the test to the **spec** and let it fail (that mismatch is the finding).
3. **Check custom rules / `Service` / `Controller` logic** to locate symbols and branches, but assert the **required** outcome, not the coded one.
4. Apply the techniques below to turn the requirement into a minimal-but-complete set of test cases.

> [!CAUTION]
> A test written to mirror `rules()` passes by construction and proves nothing. Always assert what the **requirement** demands.

### 1. Equivalence Partitioning (EP)
**Purpose**: Reduce the number of test cases by grouping inputs that are processed by the same logic.
- **Rule**: If one value in a partition passes/fails, all other values in that partition are assumed to behave the same way.
- **Application**: Pick **one representative value** for each valid and invalid partition.
- **Example**: For a quantity field allowing `1 to 10`:
    - Invalid Partition (< 1): Test with `0`.
    - Valid Partition (1-10): Test with `5`.
    - Invalid Partition (> 10): Test with `15`.

### 2. Boundary Value Analysis (BVA)
**Purpose**: Detect errors at the limits of input ranges (where `>=` vs `>` mistakes happen).
- **Rule**: Test the exact boundary, one step below, and one step above.
- **Application**: Test `min-1`, `min`, `min+1` and `max-1`, `max`, `max+1`.
- **Example**: For a password requiring `8 to 15` characters:
    - Test lengths: `7`, `8`, `9`, `14`, `15`, `16`.

### 3. Detailed Request Validation Matrix (Rule-Based Grouping)

The validation matrix MUST be organized **by rule type, not by field**. This means one test function per rule category that validates all fields sharing that rule — NOT one test per field per rule.

The reason for this approach is efficiency: when `name`, `email`, and `company_id` all share the `required` rule, sending a single request missing all three fields and asserting all three appear in the error response achieves the same coverage with far fewer test functions and less boilerplate.

Design test cases for these rule categories:
- **Required Rule**: One test that omits ALL required fields at once and asserts each one appears in the validation error response
- **Nullable Rule**: One test that sends `null` for each nullable field
- **Data Type Rules** (`integer`, `boolean`, `array`, `string`): One test per type constraint that sends wrong-type values for all fields sharing that type
- **Format Rules** (`email`, `url`, `regex`): One test per format rule that sends incorrectly formatted values for all fields sharing that format
- **Business Rules** (`unique`, `exists`): One test per business rule — e.g., one test for all `unique` violations, one test for all `exists` violations
- **Enum Rules**: One test that sends an invalid enum value for all enum fields at once
- **Conditional Rules** (`required_if`, `required_with`, `required_unless`): One test per conditional rule group, testing both condition-met and condition-not-met scenarios
- **BVA/Max Length Rules**: One test that sends max+1 values for all fields sharing the same max length constraint

#### ❌ Wrong: Per-Field Per-Function (verbose, wasteful)
```php
// Each field gets its own test — DO NOT do this
public function test_store_fails_when_name_is_missing(): void
{
    $payload = $this->validPayload();
    unset($payload['name']);
    $response = $this->actingAs($this->user, 'sso')
        ->postJson('/api/contacts', $payload);
    $response->assertStatus(422)
        ->assertJsonPath('errors.name', fn($e) => !empty($e));
}

public function test_store_fails_when_email_is_missing(): void
{
    $payload = $this->validPayload();
    unset($payload['email']);
    $response = $this->actingAs($this->user, 'sso')
        ->postJson('/api/contacts', $payload);
    $response->assertStatus(422)
        ->assertJsonPath('errors.email', fn($e) => !empty($e));
}

public function test_store_fails_when_company_id_is_missing(): void
{
    $payload = $this->validPayload();
    unset($payload['company_id']);
    $response = $this->actingAs($this->user, 'sso')
        ->postJson('/api/contacts', $payload);
    $response->assertStatus(422)
        ->assertJsonPath('errors.company_id', fn($e) => !empty($e));
}
```

#### ✅ Correct: Grouped By Rule Type (concise, same coverage)
```php
// One test covers ALL required fields at once
public function test_store_fails_when_required_fields_are_missing(): void
{
    $payload = $this->validPayload();
    unset($payload['company_id'], $payload['name'], $payload['gender'], $payload['email']);

    $response = $this->actingAs($this->user, 'sso')
        ->postJson('/api/contacts', $payload);

    $response->assertStatus(422)
        ->assertJsonPath('errors.company_id', fn($e) => !empty($e))
        ->assertJsonPath('errors.name', fn($e) => !empty($e))
        ->assertJsonPath('errors.gender', fn($e) => !empty($e))
        ->assertJsonPath('errors.email', fn($e) => !empty($e));
}

// One test covers ALL format rules (email, url, etc.)
public function test_store_fails_when_format_rules_are_violated(): void
{
    $payload = $this->validPayload();
    $payload['email'] = 'not-an-email';

    $response = $this->actingAs($this->user, 'sso')
        ->postJson('/api/contacts', $payload);

    $response->assertStatus(422)
        ->assertJsonPath('errors.email', fn($e) => !empty($e));
}

// One test covers ALL max length boundaries (group by same max value)
public function test_store_fails_when_string_fields_exceed_max_length(): void
{
    $payload = $this->validPayload();
    $payload['name'] = str_repeat('A', 51);   // max:50 + 1
    $payload['email'] = str_repeat('a', 247) . '@test.com'; // 256 chars, max:255 + 1
    $payload['phone'] = str_repeat('0', 13); // max:12 + 1

    $response = $this->actingAs($this->user, 'sso')
        ->postJson('/api/contacts', $payload);

    $response->assertStatus(422)
        ->assertJsonPath('errors.name', fn($e) => !empty($e))
        ->assertJsonPath('errors.email', fn($e) => !empty($e))
        ->assertJsonPath('errors.phone', fn($e) => !empty($e));
}
```

> [!IMPORTANT]
> The key principle is: **same rule = same test function**. The only exception is when a field requires a unique test setup that cannot be combined with other fields in a single request. For example:
> - A `unique` rule needs pre-seeded duplicate data in the database before the request.
> - An `exists` rule needs a specific foreign key setup.
> - A conditional rule like `required_if` needs its condition to be set up.
> In those cases, create a separate test for that field's specific setup need, but still avoid creating separate tests for fields that CAN be tested together.

### 4. Decision Table
**Purpose**: Map out complex business logic involving multiple conditions.
- **Rule**: Identify all input conditions and resulting actions, then map out every combination of True/False.
- **Example**: A 20% discount requires `VIP=True` AND `Order > 500k`.
    - TC1: `VIP=T`, `Order>500k=T` -> Result: 20% discount.
    - TC2: `VIP=F`, `Order>500k=T` -> Result: 10% discount (per other rules).
    - TC3: `VIP=T`, `Order>500k=F` -> Result: No discount.

### 5. State Transition
**Purpose**: Test workflows and objects that change status over time.
- **Rule**: Verify valid transitions (Happy Path) and explicitly test **INVALID** transitions (Negative Path).
- **Example**: An order status `New` -> `Paid` -> `Shipping` -> `Done`. Customer only can cancel order in `New` status.
    - **Happy Path**: Pay for a `New` order.
    - **Negative Path**: Attempt to cancel an order that is already `Paid` or `Shipping`.

## Mandatory Assertions
Every Feature Test MUST assert:
1. **HTTP Status Code**: `assertStatus(200 | 201 | 204 | 400 | 401 | 403 | 404 | 422)`.
2. **Response Structure**: `assertJsonStructure` or `assertJsonPath` on key fields.
3. **Database State** (for mutations): `assertDatabaseHas()` or `assertDatabaseMissing()`.
4. **Side Effects** (if applicable): Jobs dispatched, Mails sent, Events fired.

## Negative / Error Cases
Every Feature Test file MUST also cover:
- **Unauthenticated** (`401`): Call without `actingAs`.
- **Forbidden** (`403`): Call with a user that lacks permission.
- **Validation Error** (`422`): Send invalid/missing fields, grouped by rule type (see Validation Matrix above).
- **Not Found** (`404`): Reference a non-existent resource.
- **Business Rule Violation** (`400`): Trigger a known business constraint failure.
