# Job Architecture & Naming

## 1. Architecture Flow

**Pattern**: `Dispatch` → `Queue` → `Handle (Job Stub)` → `Background Service` → `Common Service / Models`

1.  **Job Stub (`app/Jobs`)**: A thin shell that only handles the Queue infrastructure.
2.  **Background Service (`app/Services/Background`)**: The entry point for logic. Handles bulk processing, complex flows, and database transactions.
3.  **Common Service (`app/Services/Common`)**: Provides shared logic/utilities used by both API and Background layers.

---

## 2. Naming & Location

| Component | Path |
|-----------|------|
| **Job** | `app/Jobs/{Feature}Job.php` |
| **Background Service** | `app/Services/Background/{Feature}BackgroundService.php` |
| **Background DTO** | `app/DTOs/Background/{Module}/{Action}Data.php` |
| **Factory** | All background services MUST be registered in `App\Factories\BackgroundFactory.php` |

### Queue Naming

Use named queues to prioritize processing. Define the `$queue` property in the Job class:

```php
class FeatureJob implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $queue = 'high'; // or 'default', 'low'
}
```

**Default queue names**: `high`, `default`, `low`.

---

## 3. Job Shell Setup

All Jobs MUST implement `ShouldQueue` and use these traits:

```php
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FeatureJob implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
}
```
