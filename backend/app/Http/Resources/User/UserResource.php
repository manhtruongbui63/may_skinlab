<?php

namespace App\Http\Resources\User;

use App\Helpers\DateHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\User
 */
class UserResource extends JsonResource
{
    /**
     * Disable the outer "data" wrapper; responses are wrapped by ResponseHelper.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array{id: int, name: string, email: string, status: int, status_label: string, created_at: string, updated_at: string}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'email' => (string) $this->email,
            'status' => (int) $this->status->value,
            'status_label' => (string) $this->status->label(),
            'created_at' => DateHelper::formatDateTime($this->created_at),
            'updated_at' => DateHelper::formatDateTime($this->updated_at),
        ];
    }
}
