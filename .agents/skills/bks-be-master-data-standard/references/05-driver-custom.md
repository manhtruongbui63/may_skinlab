# Custom Driver

For complex logic, tree structures, or paginated lists with search and exclusion.

---

## 1. Basic Tree Structure

```php
'departments' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getDepartmentsTree',
],

protected function getDepartmentsTree(): array
{
    return Department::defaultOrder()->get()->toTree()->toArray();
}
```

**Input Example**: `GET /api/master-data?resources[departments]={}`

---

## 2. Pagination, Search, and Selected Items

The `paginate()` helper automatically handles:
- **Search**: If `search_field` is provided and `?resources[users]={"search":"keyword"}` is sent.
- **Pagination**: Handles `page` and `per_page` params in the JSON object.
- **Selected Items**: If `?resources[users]={"selected":[1,2,3]}` is sent, these IDs will be fetched and placed at the top of the first page.

```php
'users_active' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getActiveUsers',
],

protected function getActiveUsers(array $resource): array
{
    $query = User::query()
        ->select(['id', 'name', 'avatar', 'email'])
        ->where('status', UserStatus::ACTIVE)
        ->orderBy('name', 'asc');

    // 'name' is the field used for the 'search' parameter
    return $this->paginate($resource, $query, 'name');
}
```

**Input Example**: `GET /api/master-data?resources[users_active]={"search":"john","page":2,"per_page":15}`

---

## 3. Custom Filtering and Exclusion

You can access raw parameters via `$resource['params']` to implement custom logic like exclusion.

```php
'available_mentors' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getAvailableMentors',
],

protected function getAvailableMentors(array $resource): array
{
    $params = $resource['params'];
    $query = User::query()
        ->where('role', 'mentor')
        ->where('status', UserStatus::ACTIVE);

    // Manual exclusion logic
    if (!empty($params['exclude_ids'])) {
        $query->whereNotIn('id', (array) $params['exclude_ids']);
    }

    return $this->paginate($resource, $query, 'name');
}
```

**Input Example**: `GET /api/master-data?resources[available_mentors]={"exclude_ids":[5,9]}`

---

## 4. Resource Authentication Context

Use `$this->user` to filter data based on the current user's permissions or organization.

```php
'my_team_members' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getMyTeamMembers',
],

protected function getMyTeamMembers(array $resource): array
{
    if (!$this->user || !$this->user->department_id) {
        return [];
    }

    $query = User::query()
        ->where('department_id', $this->user->department_id)
        ->where('id', '!=', $this->user->id);

    return $query->get()->toArray();
}
```

**Input Example**: `GET /api/master-data?resources[my_team_members]={}`
