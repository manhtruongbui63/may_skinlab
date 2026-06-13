# Enum Driver

## Usage

Extracts options from a PHP Enum.

```php
'user_statuses' => [
    'driver' => self::DRIVER_ENUM,
    'target' => UserStatus::class,
],
```

**Input Example**: `GET /api/master-data?resources[user_statuses]={}`

## Requirements

The Enum class MUST have an `options()` method that returns the available options.
