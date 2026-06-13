# Performance Testing Reference

**Scope**: Verify response times, memory usage, and resource efficiency under normal and peak loads.

## When to Use
- Database queries with potential N+1 issues
- Complex calculations or data transformations
- Endpoints handling large datasets (>1000 records)
- Critical business operations (payment, report generation)

## Mandatory Assertions
```php
use Illuminate\Support\Facades\DB;

public function test_endpoint_completes_within_threshold(): void
{
    DB::enableQueryLog();
    
    // Act
    $start = microtime(true);
    $response = $this->actingAs($this->user)->getJson('/api/large-dataset');
    $duration = (microtime(true) - $start) * 1000; // ms
    
    // Assert
    $this->assertLessThan(500, $duration, 'Response time exceeds 500ms');
    $this->assertLessThan(20, count(DB::getQueryLog()), 'N+1 query detected');
    $response->assertStatus(200);
}
```

## Performance Thresholds
| Operation Type | Max Response Time | Max Query Count |
|---------------|------------------|-----------------|
| Simple CRUD | 100ms | 5 queries |
| List with relations | 300ms | 10 queries |
| Complex report | 2000ms | 20 queries |
| Bulk operation | 5000ms | 50 queries |

> [!TIP]
> Always use `DB::enableQueryLog()` and assert query count to catch N+1 problems early.
