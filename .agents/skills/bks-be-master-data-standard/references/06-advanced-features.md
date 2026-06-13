# Advanced Features

## Authentication

Restrict access to a resource using the `auth` key. The user instance is accessible via `$this->user`.

```php
'sensitive_data' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getSensitiveData',
    'auth' => ['admin', 'super-admin'], // Checks $this->user->isAdmin(), etc.
],
```

## Array Conversion

Set `convert_array` to `true` to ensure the result is a re-indexed array (0, 1, 2...). Use this when the driver returns a Collection with non-sequential keys (e.g., after `filter()` or when keyed by ID), which would otherwise cause JSON to serialize as an object instead of an array.

```php
'filtered_items' => [
    'driver' => self::DRIVER_ELOQUENT,
    'target' => Item::class,
    'select' => ['id', 'name'],
    'convert_array' => true,  // Forces Collection → array_values()
],
```
