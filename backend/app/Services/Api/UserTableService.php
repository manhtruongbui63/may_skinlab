<?php

namespace App\Services\Api;

use App\Models\User;
use App\Services\Base\TableService;
use Illuminate\Database\Eloquent\Builder;

class UserTableService extends TableService
{
    /**
     * @var string[]
     */
    protected $searchables = [
        'users.name',
        'users.email',
    ];

    /**
     * @var string[]
     */
    protected $orderables = [
        'id' => 'users.id',
        'name' => 'users.name',
        'email' => 'users.email',
        'created_at' => 'users.created_at',
    ];

    /**
     * @var string[]
     */
    protected $filterables = [
        'status' => 'users.status',
        'created_from' => 'filterCreatedFrom',
        'created_to' => 'filterCreatedTo',
    ];

    /**
     * @return Builder
     */
    public function makeNewQuery()
    {
        return User::query()
            ->selectRaw($this->getSelectRaw());
    }

    /**
     * @return string
     */
    protected function getSelectRaw(): string
    {
        $fields = [
            'users.id',
            'users.name',
            'users.email',
            'users.status',
            'users.created_at',
            'users.updated_at',
        ];

        return implode(', ', $fields);
    }

    /**
     * Filter Created From
     *
     * @param Builder $query
     * @param array $filter
     * @return void
     */
    protected function filterCreatedFrom($query, $filter)
    {
        $query->where('users.created_at', '>=', $filter['data']);
    }

    /**
     * Filter Created To
     *
     * @param Builder $query
     * @param array $filter
     * @return void
     */
    protected function filterCreatedTo($query, $filter)
    {
        $query->where('users.created_at', '<=', $filter['data']);
    }
}
