# Core Components

## Overview

Master Data provides centralized lookups (dropdowns, constants, configurations) for the frontend via a unified API.

## Core Components

| Component | Path |
|-----------|------|
| **Controller** | `App\Http\Controllers\Api\MasterDataController` |
| **Service** | `App\Services\Api\MasterDataService` (inherits from `Base\MasterDataService`) |
| **Request** | `App\Http\Requests\MasterData\MasterDataShowRequest` |
| **Logic Doc** | `docs/logic/user/master-data.md` |
| **API Doc** | `docs/api/modules/master-data.md` |

## Available Drivers

| Driver | Constant | Usage |
|--------|----------|-------|
| **Eloquent** | `self::DRIVER_ELOQUENT` | Simple list from a database table. |
| **Enum** | `self::DRIVER_ENUM` | Options from a PHP Enum class (must have `options()` method). |
| **Custom** | `self::DRIVER_CUSTOM` | Complex logic, trees, or filtered queries. |
| **Config** | `self::DRIVER_CONFIG` | Raw data from Laravel `config()`. |
| **Config Trans** | `self::DRIVER_CONFIG_TRANS` | Translated data from config. |

## Resource Registration

Add a new entry to the `$availableResources` array in `backend/app/Services/Api/MasterDataService.php`.
