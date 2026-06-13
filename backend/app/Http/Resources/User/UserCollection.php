<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $paginator = $this->resource;

        return [
            'data' => UserResource::collection($paginator),
            'per_page' => (int) $paginator->perPage(),
            'total_page' => (int) $paginator->lastPage(),
            'current_page' => (int) $paginator->currentPage(),
            'total' => (int) $paginator->total(),
        ];
    }
}
