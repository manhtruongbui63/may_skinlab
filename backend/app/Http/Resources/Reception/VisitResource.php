<?php

declare(strict_types=1);

namespace App\Http\Resources\Reception;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Visit
 */
class VisitResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param \Illuminate\Http\Request $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'queue_number' => $this->queue_number,
            'registration_type' => $this->when(
                $this->registration_type !== null,
                fn () => [
                    'value' => $this->registration_type->value,
                    'label' => $this->registration_type->label(),
                ],
            ),
            'status' => $this->when(
                $this->status !== null,
                fn () => [
                    'value' => $this->status->value,
                    'label' => $this->status->label(),
                ],
            ),
            'is_priority' => $this->is_priority,
            'visited_at' => $this->visited_at?->toISOString(),
            'appointment_date' => $this->appointment_date?->toISOString(),
            'reason' => $this->reason,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'code' => $this->customer->code,
                'full_name' => $this->customer->full_name,
                'phone' => $this->customer->phone,
                'gender' => $this->customer->gender !== null ? [
                    'value' => $this->customer->gender->value,
                    'label' => $this->customer->gender->label(),
                ] : null,
            ]),
            'clinic_room' => $this->whenLoaded('clinicRoom', fn () => [
                'id' => $this->clinicRoom->id,
                'name' => $this->clinicRoom->name,
            ]),
            'services' => $this->whenLoaded(
                'services',
                fn () => $this->services->map(fn ($service) => [
                    'id' => $service->id,
                    'name' => $service->name,
                ]),
            ),
            'packages' => $this->whenLoaded(
                'packages',
                fn () => $this->packages->map(fn ($package) => [
                    'id' => $package->id,
                    'name' => $package->name,
                ]),
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
