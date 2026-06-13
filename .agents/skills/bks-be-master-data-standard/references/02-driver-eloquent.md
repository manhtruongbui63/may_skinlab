# Eloquent Driver

## Basic Usage

Simple list from a model.

```php
'roles' => [
    'driver' => self::DRIVER_ELOQUENT,
    'target' => Role::class,
    'select' => ['id', 'name'],
],
```

**Input Example**: `GET /api/master-data?resources[roles]={}`

---

## Configuration Options

| Key | Required | Description |
|-----|----------|-------------|
| `target` | ✅ | Model class name. |
| `select` | ❌ | Array of columns to select. Use to avoid fetching unnecessary columns. |
| `order` | ❌ | Array `['column', 'direction']` to sort results. If omitted, results follow DB default order. |
| `where` | ❌ | Array of where conditions. Use to filter results by column values. |

---

## Advanced Example

**Example with `order` and `where`:**

```php
'active_roles' => [
    'driver' => self::DRIVER_ELOQUENT,
    'target' => Role::class,
    'select' => ['id', 'name'],
    'where' => [['is_active', '=', true]],  // Filter only active roles
    'order' => ['name', 'asc'],            // Sort alphabetically
],
```

**Input Example**: `GET /api/master-data?resources[active_roles]={}`
