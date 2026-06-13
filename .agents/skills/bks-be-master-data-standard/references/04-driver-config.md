# Config & Translation Driver

## Usage

Maps config values to translation keys.

```php
'genders' => [
    'driver' => self::DRIVER_CONFIG_TRANS,
    'target' => 'master.genders', // config('master.genders') => [1 => 'male', 2 => 'female']
    'target_trans' => 'response.gender', // trans('response.gender.male') => 'Nam'
],
```

**Input Example**: `GET /api/master-data?resources[genders]={}`

## Configuration Options

| Key | Required | Description |
|-----|----------|-------------|
| `target` | ✅ | Config key path to get raw values. |
| `target_trans` | ✅ | Translation key prefix for labels. |

## How It Works

1. The driver reads `config('master.genders')` which returns `[1 => 'male', 2 => 'female']`
2. For each value, it calls `trans('response.gender.' . $value)` to get the display label
3. Returns a formatted array: `[['id' => 1, 'name' => 'Nam'], ['id' => 2, 'name' => 'Nữ']]`
