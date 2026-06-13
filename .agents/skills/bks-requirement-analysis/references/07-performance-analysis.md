# Performance Analysis During Requirements

Analyze performance implications early in the requirements phase to prevent costly rework later.

---

## Query Volume Assessment

### Read Operations

| Factor | Questions to Ask | Impact Level |
|--------|----------------|--------------|
| **List Pagination** | Will this feature display paginated lists? How many items per page? | High |
| **Search Complexity** | Will users search/filter by multiple fields simultaneously? | High |
| **Sorting Requirements** | Will lists be sorted by calculated or joined columns? | Medium |
| **Real-time Updates** | Does the UI require polling or WebSocket updates? | High |

### Write Operations

| Factor | Questions to Ask | Impact Level |
|--------|----------------|--------------|
| **Bulk Operations** | Will users import/export data in batches? | High |
| **Concurrent Writes** | Can multiple users update the same records? | Critical |
| **Cascade Effects** | Does updating one record affect many related records? | High |
| **Audit Trail** | Must all changes be logged for compliance? | Medium |

---

## Data Volume Projections

### Scale Estimation Table

Include this analysis in your requirement specification:

| Entity | Initial Volume | 1-Year Projection | 3-Year Projection | Query Pattern |
|--------|----------------|-------------------|-------------------|---------------|
| Users | 1,000 | 10,000 | 50,000 | Single record, list |
| Orders | 10,000 | 500,000 | 5,000,000 | Time-range queries |
| Audit Logs | 100,000 | 10M | 100M | Batch export only |

### Decision Matrix

Based on projections, determine architectural requirements:

| Volume Level | Recommended Actions |
|--------------|---------------------|
| **Low** (< 100K records) | Standard Eloquent, standard indexes |
| **Medium** (100K - 1M) | Eager loading, careful N+1 prevention |
| **High** (1M - 10M) | Query optimization, caching, queue writes |
| **Very High** (> 10M) | Consider partitioning, read replicas, async processing |

---

## Critical Path Analysis

### High-Frequency Operations

Identify operations that will be executed most frequently:

```markdown
### Critical Path: Order Creation

**Trigger**: User clicks "Place Order"
**Frequency**: Expected 100 orders/minute at peak

**Performance Requirements**:
| Step | Max Acceptable Time | Optimization Strategy |
|------|---------------------|------------------------|
| 1. Validate cart | 50ms | In-memory validation |
| 2. Check inventory | 100ms | Cached inventory counts |
| 3. Reserve stock | 150ms | Row-level locking (`lockForUpdate`) |
| 4. Create order | 200ms | Transaction batch |
| 5. Send notification | Async | Queue via background job |
| **Total (Sync)** | **500ms** | — |
| **Total (User Experience)** | **500ms** | Notifications async |
```

### Synchronous vs Asynchronous

| Operation | Sync Threshold | Async Strategy |
|-----------|----------------|----------------|
| Simple CRUD | < 200ms | Immediate response |
| File Processing | > 500ms | Queue + polling/push |
| Bulk Operations | > 1s | Queue + progress tracking |
| External API Calls | Any duration | Queue + retry logic |

---

## Database Design for Performance

### Index Planning

For each new table, document index requirements:

```markdown
### Table: `orders`

**Query Patterns**:
- Find orders by user: `WHERE user_id = ?`
- List active orders: `WHERE status = ? ORDER BY created_at DESC`
- Date range reports: `WHERE created_at BETWEEN ? AND ?`

**Required Indexes**:
| Index Type | Columns | Rationale |
|------------|---------|-----------|
| FK Index | `user_id` | JOIN performance |
| Composite | `status, created_at` | Common filter + sort |
| Range | `created_at` | Date range queries |
```

### N+1 Prevention Strategy

Document expected relationships and loading strategy:

```markdown
### Entity: Order

**Relationships**:
| Relation | Cardinality | Loading Strategy |
|----------|-------------|----------------|
| user | belongsTo | Eager load in lists |
| items | hasMany | Eager load in lists |
| statusHistory | hasMany | Lazy load (detail only) |
| auditLogs | hasMany | Never load in API |
```

---

## Caching Strategy

### Cacheable Data Identification

| Data Type | Cache Duration | Invalidation Trigger |
|-----------|----------------|----------------------|
| Static lookup lists | 24 hours | Manual/admin only |
| User permissions | 1 hour | Permission change event |
| Aggregated statistics | 5 minutes | Data update event |
| Session data | Duration of session | Logout/timeout |

### Cache Warm-up Requirements

Document if certain data needs pre-warming:

```markdown
### Warm-up Required: Product Catalog

**Data**: Active products, categories, pricing
**Trigger**: Application deployment
**Frequency**: Daily at 3 AM
**Source**: `ProductService::getActiveCatalog()`
```

---

## Background Processing Needs

### Queue Strategy

Identify what should be processed asynchronously:

| Task Type | Queue Priority | Max Runtime | Retry Strategy |
|-----------|----------------|-------------|----------------|
| Email notifications | Low | 30s | 3 attempts, 5min interval |
| PDF generation | Medium | 5min | 3 attempts, exponential backoff |
| Data exports | Low | 30min | Manual retry only |
| Webhook dispatch | High | 10s | Immediate retry, then exponential |

### Scheduled Tasks

Document recurring background jobs:

```markdown
### Scheduled: Daily Report Generation

**Frequency**: Daily at 00:00 UTC
**Task**: Generate daily sales report
**Estimated Runtime**: 10 minutes
**Impact**: Low (runs during off-peak)
**Rollback**: Report can be regenerated on demand
```

---

## Performance Acceptance Criteria

Include specific performance targets in requirements:

```markdown
## Performance Requirements

### Response Time SLAs

| Operation | p50 Target | p95 Target | p99 Target |
|-----------|------------|------------|------------|
| Page Load (initial) | < 500ms | < 800ms | < 1.5s |
| API List (100 items) | < 200ms | < 500ms | < 1s |
| API Create | < 300ms | < 600ms | < 1s |
| Search | < 300ms | < 800ms | < 1.5s |
| Export (10K records) | < 10s | < 30s | < 60s |

### Throughput Requirements

| Endpoint | Expected Load | Peak Load |
|----------|---------------|-------------|
| GET /api/orders | 100 req/min | 500 req/min |
| POST /api/orders | 50 req/min | 200 req/min |
| Export job | 10/hour | 50/hour |

### Resource Constraints

| Resource | Soft Limit | Hard Limit |
|----------|------------|------------|
| Memory per request | 128MB | 256MB |
| Database connections | 80% pool | 95% pool |
| Queue workers | 5 concurrent | 10 concurrent |
```

---

## Anti-Patterns to Avoid

Document performance anti-patterns specific to this feature:

| Anti-Pattern | Why it's harmful | Prevention |
|--------------|------------------|------------|
| SELECT * in list views | Retrieves unnecessary data | Explicit column selection |
| Counting large tables | `COUNT(*)` is slow on big tables | Cached counts or estimated counts |
| Processing in loops | N+1 queries, memory exhaustion | Batch processing, chunking |
| Loading all data into memory | Out of memory errors | Cursor-based processing |
| Missing pagination | Unbounded result sets | Mandatory page/size parameters |
| Synchronous external calls | Blocks user request | Queue + callback/polling |

---

## Performance Testing Requirements

Include testing scenarios in the requirement:

```markdown
## Performance Testing Scenarios

### Load Test: Order Creation
**Scenario**: Simulate 100 concurrent users placing orders
**Duration**: 10 minutes
**Expected**: < 5% error rate, p95 < 1s

### Stress Test: Peak Load
**Scenario**: Double normal traffic for 30 minutes
**Expected**: Graceful degradation, no data loss

### Spike Test: Flash Sale
**Scenario**: Traffic increases 10x in 1 minute
**Expected**: Queue-based processing, user sees "processing" state

### Endurance Test: Sustained Load
**Scenario**: Normal load for 24 hours
**Expected**: No memory leaks, consistent response times
```

---

## Related

- [bks-be-api-standard](../../bks-be-api-standard/SKILL.md) - API implementation with performance patterns
- [bks-be-database-standard](../../bks-be-database-standard/SKILL.md) - Database design and indexing
- [bks-be-job-standard](../../bks-be-job-standard/SKILL.md) - Background job patterns
