# Reference 07: Resource & Collection Standards

> **Scope**: JsonResources and ResourceCollections for data transformation and type-safe presentation.

---

## 1. Principles

- **Transformation Only**: NO business logic, NO database queries, and NO authorization checks inside Resources.
- **Mandatory Docblocks**: ALWAYS include `@mixin \App\Models\ModelName` for IDE support and automated Scramble documentation.
- **Type Safety**: Use explicit casting for basic types (string, int, float) to ensure JS-friendly JSON.
- **Naming Convention**: Single Resource uses `ModelNameResource` (e.g., `AuthorResource`). Collection uses `ModelNameCollection` (e.g., `AuthorCollection`). Group into namespaces by domain.
- **Property Access**: ALWAYS use `$this->property` (property delegation). NEVER use `$this->resource->property` or `$this['property']`.
- **Explicit Return Type**: ALWAYS declare `public function toArray(Request $request): array`.

---

## 2. N+1 Prevention

NEVER access a relationship directly. ALWAYS use `whenLoaded()`.

```php
return [
    'id' => $this->id,
    'user' => new UserResource($this->whenLoaded('user')), // ✅ Correct
];
```

---

## 3. Explicit Casting & Pagination

Cast basic types where DB input might be inconsistent. Collections MUST follow this exact pagination format:

```php
public function toArray(Request $request): array
{
    $paginator = $this->resource;
    return [
        'data' => FeatureResource::collection($paginator),
        'per_page' => (int) $paginator->perPage(),
        'total_page' => (int) $paginator->lastPage(),
        'current_page' => (int) $paginator->currentPage(),
        'total' => (int) $paginator->total(),
    ];
}
```

---

## 4. Usage Context

- **JsonResource**: Use for single entity responses (`detail`, `store`, `update`).
- **ResourceCollection**: Use for all list/search endpoints that return paginated data.

---

## 5. Mandatory Field Formatting Rules (CRITICAL)

EVERY field in a Resource's `toArray()` MUST follow these formatting rules:

| Field Type | Detection Pattern | Required Helper | Example |
|---|---|---|---|
| **Date** | `*_date`, `published_date`, date-of-birth | `DateHelper::formatDate($this->field)` | `'published_date' => DateHelper::formatDate($this->published_date)` |
| **DateTime** | `created_at`, `updated_at`, `*_at`, `*_time` | `DateHelper::formatDateTime($this->field)` | `'created_at' => DateHelper::formatDateTime($this->created_at)` |
| **File/Image URL** | `*_url`, `avatar`, `image`, `photo` | `FileHelper::getFullUrl($this->field)` | `'avatar_url' => FileHelper::getFullUrl($this->avatar_url)` |
| **Thumbnail** | When thumbnail variant needed | `FileHelper::getFullUrlThumb($this->field)` | `'avatar_thumb' => FileHelper::getFullUrlThumb($this->avatar_url)` |
| **Enum** | Status/type columns with model casts | `$this->field->value` + `$this->field->label()` | `'status' => $this->status->value` + `'status_label' => $this->status->label()` |

> [!CAUTION]
> **FORBIDDEN Anti-patterns:**
> ```php
> // ❌ FORBIDDEN: Raw date/datetime
> 'created_at' => $this->created_at,
> 'updated_at' => $this->updated_at,
> 
> // ❌ FORBIDDEN: Raw file path
> 'avatar_url' => $this->avatar_url,
> 
> // ❌ FORBIDDEN: Manual Carbon formatting in Resource
> 'created_at' => $this->created_at->format('Y-m-d'),
> ```

---

## 6. Complete Resource Example

```php
use App\Helpers\DateHelper;
use App\Helpers\FileHelper;

/**
 * @mixin \App\Models\Author
 */
class AuthorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'avatar_url' => FileHelper::getFullUrl($this->avatar_url),
            'avatar_thumb' => FileHelper::getFullUrlThumb($this->avatar_url),
            'bio' => (string) $this->bio,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'books' => BookResource::collection($this->whenLoaded('books')),
            'created_at' => DateHelper::formatDateTime($this->created_at),
            'updated_at' => DateHelper::formatDateTime($this->updated_at),
        ];
    }
}
```
