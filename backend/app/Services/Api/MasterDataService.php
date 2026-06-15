<?php

namespace App\Services\Api;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use App\Enums\UserStatus;
use App\Models\ClinicRoom;
use App\Models\Service;
use App\Models\ServicePackage;
use App\Models\Province;
use App\Models\Ward;
use App\Models\User;
use App\Services\Base\MasterDataService as BaseMasterDataService;

class MasterDataService extends BaseMasterDataService
{
    /**
     * @var array
     */
    protected $availableResources = [
        // ─── Enum Driver ─────────────────────────────────────
        'user_statuses' => [
            'driver' => self::DRIVER_ENUM,
            'target' => UserStatus::class,
        ],

        // ─── Customer Enums ──────────────────────────────────
        'customer_genders' => [
            'driver' => self::DRIVER_ENUM,
            'target' => GenderEnum::class,
        ],
        'customer_sources' => [
            'driver' => self::DRIVER_ENUM,
            'target' => CustomerSourceEnum::class,
        ],
        'customer_statuses' => [
            'driver' => self::DRIVER_ENUM,
            'target' => CustomerStatusEnum::class,
        ],

        // ─── Config Driver ───────────────────────────────────
        'date_formats' => [
            'driver' => self::DRIVER_CONFIG,
            'target' => 'common.date_format',
        ],

        // ─── Config Trans Driver ─────────────────────────────
        'genders' => [
            'driver' => self::DRIVER_CONFIG_TRANS,
            'target' => 'master.genders',
            'target_trans' => 'master.gender',
        ],

        // ─── Eloquent Driver (simple list) ───────────────────
        // Exposes user records, so it requires an authenticated caller.
        'users' => [
            'driver' => self::DRIVER_ELOQUENT,
            'target' => User::class,
            'select' => ['id', 'name'],
            'order' => ['name', 'asc'],
            'auth' => true,
        ],

        // ─── Eloquent Driver (with where filter) ─────────────
        // Exposes user emails (PII), so it requires an authenticated caller.
        'active_users' => [
            'driver' => self::DRIVER_ELOQUENT,
            'target' => User::class,
            'select' => ['id', 'name', 'email'],
            'where' => [['status', '=', UserStatus::ACTIVE->value]],
            'order' => ['name', 'asc'],
            'auth' => true,
        ],

        // ─── Custom Driver (with pagination & search) ────────
        // Exposes user records, so it requires an authenticated caller.
        'users_paginated' => [
            'driver' => self::DRIVER_CUSTOM,
            'target' => 'getUsersPaginated',
            'auth' => true,
        ],

        // ─── Config Driver (flat array) ──────────────────────
        'countries' => [
            'driver' => self::DRIVER_CONFIG,
            'target' => 'common.countries',
        ],

        // ─── Provinces & Wards ────────────────────────────────
        'provinces' => [
            'driver' => self::DRIVER_ELOQUENT,
            'target' => Province::class,
            'select' => ['id', 'name'],
            'order' => ['name', 'asc'],
        ],
        'wards' => [
            'driver' => self::DRIVER_CUSTOM,
            'target' => 'getWards',
        ],

        // ─── Reception Master Data ───────────────────────────
        'clinic_rooms' => [
            'driver' => self::DRIVER_ELOQUENT,
            'target' => ClinicRoom::class,
            'select' => ['id', 'name', 'code'],
            'where' => [['is_active', '=', true]],
            'order' => ['name', 'asc'],
        ],
        'services' => [
            'driver' => self::DRIVER_ELOQUENT,
            'target' => Service::class,
            'select' => ['id', 'name', 'code', 'price'],
            'where' => [['is_active', '=', true]],
            'order' => ['name', 'asc'],
        ],
        'service_packages' => [
            'driver' => self::DRIVER_ELOQUENT,
            'target' => ServicePackage::class,
            'select' => ['id', 'name', 'code', 'price'],
            'where' => [['is_active', '=', true]],
            'order' => ['name', 'asc'],
        ],
    ];

    /**
     * Custom driver: paginated users with search support.
     *
     * @param array $resource
     * @return array
     */
    protected function getUsersPaginated(array $resource): array
    {
        $query = User::query()
            ->select(['id', 'name', 'email', 'status'])
            ->orderBy('name', 'asc');

        return $this->paginate($resource, $query, 'name');
    }

    /**
     * Custom driver: get wards filtered by province_id.
     *
     * @param array $resource
     * @return array
     */
    protected function getWards(array $resource): array
    {
        $params = $resource['params'] ?? [];
        $query = Ward::query()
            ->select(['id', 'province_id', 'name'])
            ->orderBy('name', 'asc');

        if (!empty($params['province_id'])) {
            $query->where('province_id', $params['province_id']);
        }

        return $query->get()->toArray();
    }
}
