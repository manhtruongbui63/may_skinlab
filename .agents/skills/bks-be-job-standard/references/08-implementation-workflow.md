# Implementation Workflow

## Step-by-Step Implementation

If assigned a Job implementation task:

### Step 1: Preparation

Read the Task file in `docs/tasks/` to understand requirements and context.

---

### Step 2: Create DTO

Create a `final readonly` DTO in `app/DTOs/Background/{Module}/{Action}Data.php` with a `::from()` factory if needed.

---

### Step 3: Create Background Service

Implement logic in `app/Services/Background/`. The `run()` method MUST accept the DTO. Ensure **Manual Transactions** (for multi-query/locking) and N+1 prevention.

---

### Step 4: Verify Service with Unit Tests (MANDATORY)

> [!IMPORTANT]
> **Test the Background Service NOW** before wiring it to the Job. This guarantees the business logic is correct independently of queue infrastructure.

```php
// tests/Unit/Services/{Feature}BackgroundServiceTest.php
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Services\Background\{Feature}BackgroundService;
use App\DTOs\Background\{Module}\{Action}Data;
use App\Models\User;

class {Feature}BackgroundServiceTest extends TestCase
{
    use RefreshDatabase;

    private {Feature}BackgroundService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create();
        $this->service = new {Feature}BackgroundService();
        $this->service->withUser($user); // or pass system user if no actor
    }

    public function test_run_happy_path(): void
    {
        $dto = new {Action}Data(/* valid values */);
        $this->service->run($dto);
        $this->assertDatabaseHas('table', ['column' => 'expected_value']);
    }

    public function test_run_skips_when_already_processed(): void
    {
        // Arrange: set entity to 'already done' state
        // Act
        $this->service->run(new {Action}Data(/* ... */));
        // Assert: no mutation happened
        $this->assertDatabaseMissing('table', ['status' => 'reprocessed']);
    }

    // One test per conditional branch in run()
}
```

**Run**: `php artisan test --filter={Feature}BackgroundServiceTest` — MUST pass before continuing.

---

### Step 5: Update Factory

Register in `BackgroundFactory.php` and add an **Explicit Static Getter**.

---

### Step 6: Create Job Stub

Implement the thin Job class in `app/Jobs/`. Construct the DTO from job properties and delegate to the service.

---

### Step 7: Logic Documentation (MANDATORY POST-IMPLEMENTATION)

Create/Update the **Business Logic Spec** and **bump its version (minor/major)** in `docs/logic/{module}/{JobName}.md` following the Mandatory Logic Doc Format based on your final code. A task is considered FAILED if this is skipped.

---

### Step 8: BR Registry

**MANDATORY**: If new Business Rules (`BR-*`) were introduced or existing ones updated, you MUST update `docs/system/br-registry.md` to reflect these changes.

---

### Step 9: Audit & Finish

Ensure the `FLOW` and `RULES` in the Logic Doc match your code. Run `php artisan code:format`.
Run `php .agents/scripts/validate-backend.php backend` to verify job structure compliance.
Run `php artisan test --filter={JobName}` — all tests MUST pass.

---

### Step 10: Task Completion (If a task file was provided)

> [!IMPORTANT]
> **Only perform this step if the work was initiated from a task file in `docs/tasks/`.**

After all previous steps are verified and passing:
- Open the task file provided at the start of this session.
- Mark **all checklist items** as `[x]` that have been completed.
- Update the YAML frontmatter: set `status: completed`.
- If this task is part of a task index file (`docs/tasks/{date}-{feature}-implementation-tasks.md`), open the index file and:
  - Change the task row's status icon from `🔄 In Progress` (or `⏳ Pending`) to `✅ Completed`.
  - Update the **Progress Summary** counts.
- If this task is delegated from a **COORDINATION task**, open the COORDINATION task file and update the relevant row in its **Delegation Map** to `✅ Completed`.
