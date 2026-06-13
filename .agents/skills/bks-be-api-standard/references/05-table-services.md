# Reference 05: Table Service Standards

> **Scope**: TableService implementation for paginated data with searching, filtering, and ordering.

---

## 1. Basic Structure

Extend `App\Services\Base\TableService` and implement `makeNewQuery()`.

```php
class UserTableService extends TableService
{
    protected $searchables = ['users.name', 'users.email'];
    protected $filterables = [
        'status' => 'users.status',
        'created_from' => 'filterCreatedFrom', // Custom method
    ];
    protected $orderables = ['id' => 'users.id'];

    public function makeNewQuery()
    {
        return User::query()
            ->selectRaw($this->getSelectRaw());
    }

    protected function getSelectRaw(): string
    {
        $fields = [
            'users.id',
            'users.name',
            'users.email',
            'users.status',
            'users.created_at',
        ];

        return implode(', ', $fields);
    }
}
```

---

## 2. The Role of `getSelectRaw()`

- **Collision Prevention**: When performing `joins` or `with()`, columns with the same name (like `id`, `name`) can collide.
- **Implementation**: Define a `getSelectRaw()` method that returns a comma-separated string of table-prefixed columns.
- **Table Prefixing**: ALWAYS use table prefixes (e.g., `users.id`) for all fields in `$searchables`, `$filterables`, `$orderables`, and `getSelectRaw()`.

---

## 3. Custom Filter Methods

Receive `($query, $filter, $filters)`. Useful for ranges or relationships.

```php
protected function filterCreatedFrom($query, $filter)
{
    $query->where('users.created_at', '>=', $filter['data']);
}
```

---

## 4. Controller Integration

Controllers MUST use a dedicated `FormRequest` and `DTO` for TableService endpoints.

```php
public function index(UserIndexRequest $request): JsonResponse
{
    $dto = UserIndexData::from($request->validated());

    $data = ApiFactory::getUserTableService()
        ->withUser($this->guard()->user())
        ->data(...$dto->toTableParams());
    
    return $this->sendSuccessResponse(UserListResource::collection($data));
}
```

> [!NOTE]
> The legacy `convertRequest()` helper in `BaseController` is DEPRECATED in favor of the DTO pattern.

---

## 5. Best Practices

- **Explicit Selection**: Always specify columns in `makeNewQuery()` to prevent collisions during joins.
- **Relational Filtering**: Use `leftJoin` in `makeNewQuery()` when filtering or sorting by columns from a related table.
- **Many-to-Many Caution**: When joining many-to-many relationships, use `groupBy('primary_table.id')` to ensure unique results.

---

## 6. TableService Request & DTO Pattern (MANDATORY)

### A. The IndexRequest

Validates standard search, pagination, and dynamic filters/orders.

```php
// app/Http/Requests/User/UserIndexRequest.php
public function rules(): array
{
    return [
        'search' => ['nullable', 'string', 'max:' . config('validate.max_length.string')],
        'per_page' => ['nullable', 'integer', 'min:' . config('validate.min_value.per_page'), 'max:' . config('validate.max_value.per_page')],
        'orders' => ['nullable', 'array', 'max:' . config('validate.max_count.array')],
        'orders.*.key' => ['required_with:orders', 'string', 'max:' . config('validate.max_length.string')],
        'orders.*.dir' => ['required_with:orders', 'string', 'in:asc,desc'],
        'filters' => ['nullable', 'array', 'max:' . config('validate.max_count.array')],
        'filters.*.key' => ['required_with:filters', 'string', 'max:' . config('validate.max_length.string')],
        'filters.*.data' => ['nullable', 'string', 'max:' . config('validate.max_length.text')],
    ];
}
```

### B. The IndexData DTO

Orchestrates parameters into the array format required by `TableService::data()`.

```php
// app/DTOs/Api/User/UserIndexData.php
final readonly class UserIndexData
{
    public function __construct(
        public string $search = '',
        public array $orders = [],
        public array $filters = [],
        public int $perPage = 10,
    ) {}

    public static function from(array $data): self
    {
        return new self(
            search: $data['search'] ?? '',
            orders: $data['orders'] ?? [],
            filters: $data['filters'] ?? [],
            perPage: (int) ($data['per_page'] ?? 10),
        );
    }

    public function toTableParams(): array
    {
        return [$this->search, $this->orders, $this->filters, $this->perPage];
    }
}
```
