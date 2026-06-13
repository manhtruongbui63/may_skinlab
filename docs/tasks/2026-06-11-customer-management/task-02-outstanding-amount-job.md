---
task_id: "02"
title: "Outstanding Amount Calculation Job"
description: "Implement RecalculateOutstandingAmountJob to scan customers with unpaid invoices overdue by 30 days and queue reminder emails."
type: IMPLEMENTATION
phase: 2
status: skipped
estimated_effort: M
complexity: medium
risk: low
depends_on: ["01"]
rule_refs: ["PROPOSED_BR:outstanding-calculation"]
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-11"
    summary: Skipped - no other tasks depend on this. Can be implemented later independently.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-job-task`
- **Applicable Skills**: `bks-be-job-standard`

---

# Task 02: Outstanding Amount Calculation Job

## Description
Develop the background job `RecalculateOutstandingAmountJob` and schedule it in console routes. This job scans customers, recalculates their total outstanding amounts based on invoice states (if related invoices exist), and triggers debt notifications.

## Requirements

### 1. Job Class (NEW)
- File: `app/Jobs/RecalculateOutstandingAmountJob.php`
- Must implement `ShouldQueue`.
- Logic flow:
  1. Retrieve all customers with active status.
  2. For each customer, sum up unpaid invoice balances (`outstanding_amount`).
  3. If `outstanding_amount > 0` and there exists an invoice overdue > 30 days:
     - Dispatch `CustomerDebtReminderNotification` (queued).
  4. Save or log calculation metrics for audit trails.

### 2. Service Delegation (NEW)
- Service: `App\Services\Background\CustomerDebtService::processOutstandingCalculations(): void` (flat — no subfolder)
- Method signature:
  `public function processOutstandingCalculations(): void`
- DTO: Since this is a system job processing all records, no action DTO is strictly required for the entry point, but a log metadata representation can be structured.

### 3. Scheduler Registration (MODIFY)
- Wire the job to run daily in `routes/console.php`.

## Testing Hints
- **Factory needs**: Mocks or stubs for Invoice relationship on `Customer` (assert relationships function).
- **Key test scenarios**:
  - Customer with zero debt does not trigger reminder emails.
  - Customer with debt overdue > 30 days triggers `CustomerDebtReminderNotification`.
  - Customer with debt overdue < 30 days does not trigger notification.

## Status
- [ ] Create `app/Services/Background/CustomerDebtService.php`.
- [ ] Register service in `BackgroundFactory`.
- [ ] Create `app/Jobs/RecalculateOutstandingAmountJob.php`.
- [ ] Register job schedule in `routes/console.php`.
- [ ] Create mailer/notification `app/Notifications/CustomerDebtReminderNotification.php`.
- [ ] Run `php artisan code:format`.
- [ ] Run `php .agents/scripts/validate-backend.php backend` and resolve all conventions.
- [ ] Run `php artisan test` (smoke tests only).

## Acceptance Criteria
1. Job runs successfully without errors.
2. Notification is dispatched only when customer has overdue amount > 30 days.

## Error Scenarios
- Invoice relation fails/missing table (due to future table) → Fail gracefully, log warning without crashing the job.

## Dependencies
- Task 01 (Database Infrastructure) — Customer model must be defined.
