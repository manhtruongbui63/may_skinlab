<?php

namespace App\Services\Contracts;

interface TableContract
{
    /**
     * @return \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder
     */
    public function makeNewQuery();
}
