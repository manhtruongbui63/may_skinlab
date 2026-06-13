# Unit Tests Reference

**Scope**: Single class or method in isolation — NO HTTP, NO real database (mock it or use in-memory).

## When to Use (fallback for complex APIs)

Use Unit Tests when **any** of the following apply:
- The API depends on 3rd-party services (OAuth, Stripe, SSO tokens) that cannot be faked reliably.
- The Service method contains complex branching logic (>3 conditions, financial calculations, state machines).
- The full Feature Test would require too many mocks to be meaningful.
- Testing a `BackgroundService::run()` or Command logic in isolation.

> [!IMPORTANT]
> **Complex API rule**: If a full Feature Test is impractical, write Unit Tests covering **each key method** of the Service class. Specifically:
> - Every method with conditional branches should have one test per branch.
> - Every method that mutates data should assert the expected state after the call.
> - The "happy path" AND at least one "unhappy path" (exception/edge case) should be tested per method.

## Structure Template
```php
namespace Tests\Unit\{Module};

use Tests\TestCase;
use App\Services\Api\{Module}\{Feature}Service;
use App\DTOs\Api\{Module}\{Action}Data;
use App\Models\User;
use RuntimeException;
use Mockery;

class {Feature}ServiceTest extends TestCase
{
    private {Feature}Service $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->make(); // make() — no DB needed
        $this->service = new {Feature}Service();
        $this->service->withUser($this->user);
    }

    public function test_{method}_returns_expected_result(): void
    {
        // Arrange
        $dto = new {Action}Data(field: 'value');

        // Act
        $result = $this->service->{method}($dto);

        // Assert
        $this->assertSame('expected', $result->field);
    }

    public function test_{method}_throws_when_{condition}(): void
    {
        // Arrange
        $dto = new {Action}Data(field: 'invalid');

        // Act & Assert
        $this->expectException(RuntimeException::class);
        $this->service->{method}($dto);
    }
}
```

## Mocking Rules
- **External services**: Mock using `Mockery::mock()` or Laravel's `$this->mock(Service::class)`.
- **Factories/Repositories**: If a service calls a Common Service, mock that Common Service.
- **Never mock the class under test itself**.

```php
// ✅ CORRECT — mock dependency, test real method
$common = Mockery::mock(WebhookService::class);
$common->shouldReceive('dispatch')->once()->andReturn(true);
$this->app->instance(WebhookService::class, $common);

// ❌ AVOID — mocking what you're testing
$service = Mockery::mock(AuthService::class)->makePartial();
```
