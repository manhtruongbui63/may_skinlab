<?php

declare(strict_types=1);

namespace App\Http\Resources\Appointment;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\Appointment $resource
 */
class AppointmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'customer' => $this->formatCustomer(),
            'appointment_at' => $this->resource->appointment_at?->toIso8601String(),
            'appointment_date' => $this->resource->appointment_date?->format('Y-m-d'),
            'appointment_time' => $this->resource->appointment_at?->format('H:i'),
            'status' => [
                'value' => $this->resource->status->value,
                'label' => $this->resource->status->label(),
            ],
            'note' => $this->resource->note,
            'created_at' => $this->resource->created_at?->toIso8601String(),
            'updated_at' => $this->resource->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Format the related customer data (safe-guards when relation is not loaded).
     *
     * @return array<string, mixed>|null
     */
    private function formatCustomer(): ?array
    {
        $customer = $this->resource->relationLoaded('customer')
            ? $this->resource->customer
            : null;

        if ($customer === null) {
            return null;
        }

        return [
            'id' => $customer->id,
            'full_name' => $customer->full_name,
            'phone' => $customer->phone,
        ];
    }
}
