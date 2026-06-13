# Security Testing Reference

**Scope**: Protect against common vulnerabilities and ensure authorization boundaries.

## SQL Injection Testing
```php
public function test_endpoint_resists_sql_injection(): void
{
    // Arrange - common SQL injection payloads
    $maliciousInputs = [
        "1' OR '1'='1",
        "1; DROP TABLE users; --",
        "1 UNION SELECT * FROM passwords",
        "' OR 1=1 --",
    ];
    
    foreach ($maliciousInputs as $payload) {
        $response = $this->actingAs($this->user)
            ->getJson("/api/search?q={$payload}");
        
        // Should return empty results or 422, never 500 or data leak
        $this->assertNotEquals(500, $response->getStatusCode());
    }
}
```

## Authorization Bypass (IDOR) Testing
```php
public function test_user_cannot_access_other_tenant_data(): void
{
    // Arrange
    $otherTenant = Tenant::factory()->create();
    $otherUser = User::factory()->create(['tenant_id' => $otherTenant->id]);
    $resource = Resource::factory()->create(['tenant_id' => $otherTenant->id]);
    
    // Act
    $response = $this->actingAs($this->user) // Different tenant
        ->getJson("/api/resources/{$resource->id}");
    
    // Assert
    $response->assertStatus(404); // 403 also acceptable
}
```

## Mass Assignment Protection
```php
public function test_mass_assignment_is_blocked(): void
{
    // Arrange
    $payload = [
        'name' => 'Valid Name',
        'is_admin' => true, // Protected field
        'role' => 'superadmin', // Protected field
    ];
    
    // Act
    $response = $this->actingAs($this->user)
        ->postJson('/api/users', $payload);
    
    // Assert - protected fields should not be updated
    $this->assertDatabaseHas('users', [
        'name' => 'Valid Name',
        'is_admin' => false, // Should remain unchanged
    ]);
}
```

## Rate Limiting
```php
public function test_rate_limiting_is_enforced(): void
{
    // Act - make requests beyond limit
    for ($i = 0; $i < 70; $i++) {
        $response = $this->getJson('/api/public-endpoint');
    }
    
    // Assert
    $response->assertStatus(429); // Too Many Requests
    $response->assertHeader('X-RateLimit-Remaining');
}
```

## Security Test Checklist
- [ ] SQL injection payloads return no data or 422
- [ ] XSS payloads are escaped in JSON responses
- [ ] IDOR attempts return 404 or 403
- [ ] Protected fields cannot be mass-assigned
- [ ] Rate limiting returns 429 after threshold
- [ ] CSRF tokens validated for state-changing requests
