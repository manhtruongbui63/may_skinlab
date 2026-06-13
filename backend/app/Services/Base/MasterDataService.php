<?php

namespace App\Services\Base;

use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

abstract class MasterDataService extends Service
{
    public const DRIVER_CONFIG = 'config';

    public const DRIVER_CONFIG_TRANS = 'config_trans';

    public const DRIVER_ELOQUENT = 'eloquent';

    public const DRIVER_ELOQUENT_PAGINATE = 'eloquent_search';


    // 'company_user_roles' => [
    //     'driver' => self::DRIVER_CUSTOM,
    //     'target' => 'getCompanyUserRoles',
    // ],
    public const DRIVER_CUSTOM = 'custom';

    // 'user_status' => [
    //     'driver' => self::DRIVER_ENUM,
    //     'target' => UserStatus::class,
    // ],
    public const DRIVER_ENUM = 'enum';

    public const DEFAULT_PER_PAGE = 20;

    /**
     * @var null
     */
    protected $user = null;

    /**
     * @var array
     */
    protected array $resources = [];

    /**
     * @var array
     */
    protected $availableResources = [];

    /**
     * @var null
     */
    protected $data = null;

    /**
     * With resources
     *
     * @param array $resources
     * @return $this
     */
    public function withResources(array $resources)
    {
        $rs = [];
        foreach ($resources as $resourceName => $resourceParams) {
            if ($this->isAvailableResource($resourceName)) {
                $rs[] = [
                    'name' => $resourceName,
                    'params' => $this->decodeParams($resourceParams),
                ];
            }
        }

        $this->resources = $rs;

        return $this;
    }

    /**
     * Check if is available resource
     *
     * @param $resourceName
     * @return boolean
     */
    protected function isAvailableResource($resourceName): bool
    {
        if (!isset($this->availableResources[$resourceName])) {
            return false;
        }

        return true;
    }

    /**
     * Decode input params
     *
     * @param $params
     * @return array
     */
    protected function decodeParams($params): array
    {
        try {
            if (empty($params) || !is_string($params)) {
                return [];
            }

            return json_decode($params, true) ?? [];
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Handle load resource from config driver
     *
     * @param array $resource
     * @param array $resourceConfig
     * @return array
     */
    protected function handleLoadFromConfig(array $resource, array $resourceConfig): array
    {
        return config($resourceConfig['target']);
    }

    /**
     * Handle load resource from config driver and trans
     *
     * @param array $resource
     * @param array $resourceConfig
     * @return array
     */
    protected function handleLoadFromConfigTrans(array $resource, array $resourceConfig): array
    {
        $confData = config($resourceConfig['target']);
        $data = [];
        foreach ($confData as $id => $key) {
            $data[] = [
                'id' => $id,
                'name' => trans($resourceConfig['target_trans'] . '.' . $key),
            ];
        }
        return $data;
    }

    protected function makeEloquentQuery($resourceConfig)
    {
        $query = $resourceConfig['target']::query();
        if (!empty($resourceConfig['select'])) {
            $query->select($resourceConfig['select']);
        }

        if (!empty($resourceConfig['where'])) {
            $query->where($resourceConfig['where']);
        }

        if (!empty($resourceConfig['order'])) {
            $query->orderBy($resourceConfig['order'][0], $resourceConfig['order'][1]);
        }

        return $query;
    }

    /**
     * Handle load resource from eloquent driver
     *
     * @param array $resource
     * @param array $resourceConfig
     * @return array|Collection
     */
    protected function handleLoadFromEloquent(array $resource, array $resourceConfig): array|Collection
    {
        $query = $this->makeEloquentQuery($resourceConfig);
        return $query->get();
    }

    /**
     * Handle load resource from custom driver
     *
     * @param array $resource
     * @param array $resourceConfig
     * @return array|Collection
     */
    protected function handleLoadFromCustom(array $resource, array $resourceConfig): array|Collection
    {
        return $this->{$resourceConfig['target']}($resource, $resourceConfig);
    }

    /**
     * Handle load resource from enum driver
     *
     * @param array $resource
     * @param array $resourceConfig
     * @return array
     */
    protected function handleLoadFromEnum(array $resource, array $resourceConfig): array
    {
        return $resourceConfig['target']::options();
    }

    /**
     * Handle load resource data
     *
     * @param array $resource
     * @return array|Collection
     */
    protected function handleLoad(array $resource): array|Collection
    {
        $resourceConfig = $this->availableResources[$resource['name']];
        $data = $this->{'handleLoadFrom' . Str::studly($resourceConfig['driver'])}($resource, $resourceConfig);
        if (empty($resourceConfig['convert_array'])) {
            return $data;
        }

        return $data instanceof Collection ? $data->values() : collect($data)->values();
    }

    /**
     * Load data
     *
     * @return array
     */
    public function load(): array
    {
        $data = [];
        foreach ($this->resources as $resource) {
            if ($this->canGetResource($resource)) {
                $data[$resource['name']] = $this->handleLoad($resource);
            } else {
                $data[$resource['name']] = null;
            }
        }

        $this->data = $data;

        return $data;
    }

    /**
     * Get data
     *
     * @return array|null
     */
    public function get(): ?array
    {
        if (!$this->data) {
            $this->load();
        }

        return $this->data;
    }

    /**
     * Check user login can get resource
     *
     * @param array $resource
     * @return boolean
     */
    protected function canGetResource(array $resource): bool
    {
        $resourceConfig = $this->availableResources[$resource['name']];

        $authRequirement = $resourceConfig['auth'] ?? null;

        // No auth requirement: the resource is public.
        if (empty($authRequirement)) {
            return true;
        }

        // Any protected resource requires an authenticated user.
        if (!$this->user) {
            return false;
        }

        // `auth => true` means any authenticated user is allowed.
        if (!is_array($authRequirement)) {
            return true;
        }

        // `auth => ['admin', ...]` requires the user to satisfy one of the roles.
        foreach ($authRequirement as $authName) {
            $method = 'is' . Str::studly($authName);
            if (method_exists($this->user, $method) && $this->user->{$method}()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get paginate params from resource params
     *
     * @param array $params
     * @return array
     */
    protected function getPaginateParams(array $params): array
    {
        $page = empty($params['page']) ? 1 : intval($params['page']);
        $perPage = empty($params['per_page']) ? self::DEFAULT_PER_PAGE : intval($params['per_page']);
        $search = empty($params['search']) ? '' : trim($params['search']);

        if ($page <= 0) {
            $page = 1;
        }

        if ($perPage <= 0) {
            $perPage = self::DEFAULT_PER_PAGE;
        }

        $maxPerPage = (int) config('validate.pagination.max_per_page', 100);
        if ($perPage > $maxPerPage) {
            $perPage = $maxPerPage;
        }

        return [
            'per_page' => $perPage,
            'current_page' => $page,
            'search' => $search,
        ];
    }

    /**
     * @param $params
     * @return array
     */
    protected function getSelectedItems($params): array
    {
        if (empty($params['selected']) || !is_array($params['selected'])) {
            return [];
        }

        $selectedIds = [];
        foreach ($params['selected'] as $selectedId) {
            $selectedIds[] = intval($selectedId);
        }

        return $selectedIds;
    }

    /**
     * Get resource with paginate
     *
     * @param $resource
     * @param $query
     * @param null $searchField
     * @return array
     */
    protected function paginate($resource, $query, $searchField = null): array
    {
        $params = $resource['params'];
        $pageParams = $this->getPaginateParams($params);

        $selectedIds = $this->getSelectedItems($params);
        $selectedCount = count($selectedIds);
        if ($selectedCount) {
            return $this->paginateWithSelected($query, $pageParams, $selectedIds, $searchField);
        }

        if ($searchField && $pageParams['search']) {
            $query->where($searchField, 'like', '%' . $pageParams['search'] . '%');
        }

        return $this->paginateNoSelected($query, $pageParams);
    }

    /**
     * @param $query
     * @param $pageParams
     * @param $selectedIds
     * @return array
     */
    protected function paginateWithSelected($query, $pageParams, $selectedIds, $searchField = null): array
    {
        $fromTable = $query->getQuery()->from;
        $limit = $pageParams['per_page'];
        $selectedItems = collect([]);
        $data = collect([]);
        if ($pageParams['current_page'] == 1) {
            $selectedItemQuery = clone $query;
            $selectedItems = $selectedItemQuery->whereIn($fromTable . '.id', $selectedIds)->get();
            $limit = $limit - $selectedItems->count();
        }

        if ($searchField && $pageParams['search']) {
            $query->where($searchField, 'like', '%' . $pageParams['search'] . '%');
        }
        $query->whereNotIn($fromTable . '.id', $selectedIds);

        $total = $query->count();
        $offset = $pageParams['per_page'] * ($pageParams['current_page'] - 1);
        $totalPage = ceil($total / $pageParams['per_page']);
        if ($limit > 0) {
            $data = $query->offset($offset)->limit($limit)->get();
        }

        return [
            'data' => $selectedItems->merge($data)->toArray(),
            'per_page' => $pageParams['per_page'],
            'total_page' => (!$totalPage && $total > 0) ? 1 : $totalPage,
            'current_page' => $pageParams['current_page'],
            'total' => $total + $selectedItems->count(),
        ];
    }

    /**
     * @param $query
     * @param $pageParams
     * @return array
     */
    protected function paginateNoSelected($query, $pageParams): array
    {
        $total = $query->count();
        $offset = $pageParams['per_page'] * ($pageParams['current_page'] - 1);
        $data = $query->offset($offset)->limit($pageParams['per_page'])->get();

        return [
            'data' => $data->toArray(),
            'per_page' => $pageParams['per_page'],
            'total_page' => ceil($total / $pageParams['per_page']),
            'current_page' => $pageParams['current_page'],
            'total' => $total,
        ];
    }
}
