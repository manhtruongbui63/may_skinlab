# Integration & Concurrency Testing Reference

## Integration Testing

**Scope**: Verify interaction between multiple services, modules, or external systems.

### Cross-Service Integration
```php
public function test_user_creation_triggers_notification_and_audit(): void
{
    // Arrange
    Notification::fake();
    Event::fake([AuditLogCreated::class]);
    
    // Act
    $response = $this->actingAs($this->admin)
        ->postJson('/api/users', $userData);
    
    // Assert - verify all side effects
    $response->assertStatus(201);
    Notification::assertSentTo($user, WelcomeNotification::class);
    Event::assertDispatched(AuditLogCreated::class, fn ($e) => 
        $e->action === 'user.created'
    );
}
```

### Database Transaction Integrity
```php
public function test_operation_rolls_back_on_partial_failure(): void
{
    // Arrange - mock service to throw after partial success
    $this->mock(PaymentService::class, fn ($mock) => 
        $mock->shouldReceive('process')
            ->once()
            ->andThrow(new RuntimeException('Payment failed'))
    );
    
    // Act
    $this->expectException(RuntimeException::class);
    $this->service->createOrderWithPayment($orderData);
    
    // Assert - verify rollback
    $this->assertDatabaseMissing('orders', ['reference' => $orderData['reference']]);
    $this->assertDatabaseMissing('payments', ['order_reference' => $orderData['reference']]);
}
```

## Concurrency & Race Condition Testing

**Scope**: Verify system behavior under parallel execution.

### Optimistic Locking
```php
public function test_concurrent_updates_respect_optimistic_locking(): void
{
    // Arrange
    $resource = Resource::factory()->create(['version' => 1]);
    
    // Simulate two concurrent updates
    $response1 = $this->actingAs($this->user)
        ->putJson("/api/resources/{$resource->id}", [
            'name' => 'Update 1',
            'version' => 1,
        ]);
    
    $response2 = $this->actingAs($this->user)
        ->putJson("/api/resources/{$resource->id}", [
            'name' => 'Update 2',
            'version' => 1, // Stale version
        ]);
    
    // Assert
    $response1->assertStatus(200);
    $response2->assertStatus(409); // Conflict - stale version
}
```

### Unique Constraint Race Condition
```php
public function test_concurrent_duplicate_creation_handled_gracefully(): void
{
    // Arrange - unique constraint on 'email'
    $email = 'unique@example.com';
    
    // Use parallel requests or database transactions
    $results = ParallelTesting::run(fn () =>
        User::create(['email' => $email, 'name' => 'Test'])
    , times: 2);
    
    // Assert - only one succeeds
    $this->assertEquals(1, User::where('email', $email)->count());
}
```
