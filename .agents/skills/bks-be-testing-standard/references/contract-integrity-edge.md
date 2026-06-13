# Contract, Data Integrity & Edge Cases Reference

## API Contract & Backward Compatibility Testing

**Scope**: Ensure API contracts are honored and changes don't break clients.

### Schema Validation
```php
public function test_response_matches_openapi_schema(): void
{
    $response = $this->actingAs($this->user)->getJson('/api/users/1');
    
    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email',
                'created_at',
                'updated_at',
            ],
            'meta' => [
                'version',
            ],
        ]);
    
    // Ensure no extra fields are leaked
    $data = $response->json('data');
    $this->assertArrayNotHasKey('password', $data);
    $this->assertArrayNotHasKey('secret_token', $data);
}
```

### Backward Compatibility
```php
public function test_deprecated_fields_still_work(): void
{
    // Old client sending deprecated field
    $response = $this->actingAs($this->user)
        ->postJson('/api/orders', [
            'customer_name' => 'John', // Deprecated, use 'name'
            'name' => 'John Doe',      // New field
        ]);
    
    $response->assertStatus(201);
    // Should handle both or prefer new field
}
```

## Data Integrity & Migration Testing

**Scope**: Verify data consistency and migration safety.

### Migration Rollback
```php
public function test_migration_is_reversible(): void
{
    // Apply migration
    $this->artisan('migrate', ['--path' => 'database/migrations/2024_01_01_000000_add_column.php']);
    
    // Insert test data
    Model::factory()->create(['new_column' => 'value']);
    
    // Rollback
    $this->artisan('migrate:rollback', ['--path' => 'database/migrations/2024_01_01_000000_add_column.php']);
    
    // Assert - table still exists, old data intact
    $this->assertTrue(Schema::hasTable('models'));
    $this->assertDatabaseCount('models', 1);
}
```

### Soft Delete & Restore
```php
public function test_soft_delete_preserves_data(): void
{
    $resource = Resource::factory()->create();
    $id = $resource->id;
    
    // Soft delete
    $resource->delete();
    
    $this->assertSoftDeleted('resources', ['id' => $id]);
    $this->assertDatabaseHas('resources', ['id' => $id]); // Still in DB
    
    // Restore
    $resource->restore();
    
    $this->assertDatabaseHas('resources', [
        'id' => $id,
        'deleted_at' => null,
    ]);
}
```

### Audit Trail
```php
public function test_audit_trail_captures_all_changes(): void
{
    $user = User::factory()->create();
    
    // Update
    $user->update(['name' => 'New Name']);
    
    // Assert audit record exists
    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action' => 'updated',
        'old_values->name' => $user->getOriginal('name'),
        'new_values->name' => 'New Name',
    ]);
}
```

## Edge Cases & Boundary Testing

**Scope**: Verify behavior at boundaries and unusual inputs.

### Boundary Values
```php
public function test_boundary_conditions(): void
{
    // String max length
    $maxLength = str_repeat('a', 255);
    $response = $this->postJson('/api/items', ['name' => $maxLength]);
    $response->assertStatus(201);
    
    $exceedsMax = str_repeat('a', 256);
    $response = $this->postJson('/api/items', ['name' => $exceedsMax]);
    $response->assertStatus(422);
    
    // Numeric boundaries
    $response = $this->postJson('/api/orders', ['quantity' => 0]);
    $response->assertStatus(422); // Assuming min is 1
    
    $response = $this->postJson('/api/orders', ['quantity' => PHP_INT_MAX]);
    $response->assertStatus(422);
}
```

### Special Characters & Encoding
```php
public function test_special_characters_handled_correctly(): void
{
    $specialInputs = [
        'emoji' => '🎉 Party',
        'unicode' => '日本語テキスト',
        'xml' => '<script>alert("xss")</script>',
        'null_byte' => "data\x00null",
        'whitespace' => "  trim  ",
    ];
    
    foreach ($specialInputs as $type => $value) {
        $response = $this->postJson('/api/items', ['name' => $value]);
        $this->assertNotEquals(500, $response->getStatusCode(), "Failed on {$type}");
    }
}
```

### Empty Collections & Null Handling
```php
public function test_empty_results_return_consistent_structure(): void
{
    $response = $this->actingAs($this->user)->getJson('/api/items?filter=nonexistent');
    
    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [],
            'meta' => ['total', 'per_page', 'current_page'],
        ])
        ->assertJsonPath('data', []);
}
```

### Time-based Edge Cases
```php
public function test_timezone_and_date_boundaries(): void
{
    // Leap year
    $response = $this->postJson('/api/events', ['date' => '2024-02-29']);
    $response->assertStatus(201);
    
    // DST transition
    $response = $this->postJson('/api/events', ['datetime' => '2024-03-10T02:30:00']);
    $response->assertStatus(201); // Or 422 if invalid
    
    // Year boundary
    $response = $this->postJson('/api/reports', ['year' => 2024]);
    $response->assertJsonPath('data.fiscal_year', 2024);
}
```
