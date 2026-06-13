# Testing Standards

## Feature Tests

Add a test case in `backend/tests/Feature/Api/MasterDataTest.php`.

```php
public function test_can_get_new_resource(): void
{
    $response = $this->actingAs($this->user, 'api')
        ->getJson('/api/master-data?resources[my_resource]={}');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => ['my_resource']]);
}
```

---

## Best Practices

1. **Naming**: Use `snake_case` for resource names (e.g., `user_roles`, `departments`).
2. **Raw Data**: Master Data returns raw arrays/collections, NOT `JsonResource` objects.
3. **Efficiency**: Use `select` in Eloquent drivers to avoid fetching unnecessary columns.
4. **Single Responsibility**: The `MasterDataService` should only handle data retrieval. Complex business logic should reside in dedicated domain services.
5. **No Observers**: Never trigger side effects or observers during Master Data retrieval.
