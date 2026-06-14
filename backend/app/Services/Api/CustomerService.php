<?php

declare(strict_types=1);

namespace App\Services\Api;

use App\DTOs\Api\Customer\IndexCustomerData;
use App\DTOs\Api\Customer\StoreCustomerData;
use App\DTOs\Api\Customer\UpdateCustomerData;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Service for customer-related API operations.
 */
class CustomerService
{
    /**
     * Get paginated list of customers with filters.
     *
     * @param IndexCustomerData $data
     * @return LengthAwarePaginator
     */
    public function list(IndexCustomerData $data): LengthAwarePaginator
    {
        $query = Customer::query()
            ->with(['province', 'ward'])
            ->select([
                'id',
                'code',
                'full_name',
                'phone',
                'phone_secondary',
                'birth_date',
                'gender',
                'house_number',
                'province_id',
                'ward_id',
                'address',
                'is_address_manually_edited',
                'avatar_path',
                'source',
                'status',
                'created_at',
                'updated_at',
            ]);

        // Apply search filter
        if ($data->search) {
            $query->where(function ($q) use ($data) {
                $q->where('full_name', 'like', '%' . $data->search . '%')
                    ->orWhere('phone', 'like', '%' . $data->search . '%');
            });
        }

        // Apply province filter
        if ($data->provinceId !== null) {
            $query->where('province_id', $data->provinceId);
        }

        // Apply source filter
        if ($data->source !== null) {
            $query->where('source', $data->source);
        }

        // Apply status filter
        if ($data->status !== null) {
            $query->where('status', $data->status);
        }

        return $query->orderBy('full_name', 'asc')
            ->paginate($data->perPage, ['*'], 'page', $data->page);
    }

    /**
     * Get customer detail by ID.
     *
     * @param int $id
     * @return Customer
     * @throws ModelNotFoundException
     */
    public function getDetail(int $id): Customer
    {
        return Customer::with(['province', 'ward'])->findOrFail($id);
    }

    /**
     * Create a new customer.
     *
     * @param StoreCustomerData $data
     * @return Customer
     */
    public function create(StoreCustomerData $data): Customer
    {
        $address = $this->resolveAddress($data);

        return Customer::create([
            'full_name' => $data->fullName,
            'phone' => $data->phone,
            'phone_secondary' => $data->phoneSecondary,
            'birth_date' => $data->birthDate,
            'gender' => $data->gender,
            'house_number' => $data->houseNumber,
            'province_id' => $data->provinceId,
            'ward_id' => $data->wardId,
            'address' => $address,
            'is_address_manually_edited' => $data->isAddressManuallyEdited,
            'avatar_path' => $data->avatarPath,
            'source' => $data->source ?? 5, // Default to OTHER
            'status' => $data->status ?? 1,  // Default to ACTIVE
        ]);
    }

    /**
     * Update an existing customer.
     *
     * @param int $id
     * @param UpdateCustomerData $data
     * @return Customer
     * @throws ModelNotFoundException
     */
    public function update(int $id, UpdateCustomerData $data): Customer
    {
        $customer = Customer::findOrFail($id);

        $updateData = [];

        if ($data->fullName !== null) {
            $updateData['full_name'] = $data->fullName;
        }

        if ($data->phone !== null) {
            $updateData['phone'] = $data->phone;
        }

        if ($data->phoneSecondary !== null) {
            $updateData['phone_secondary'] = $data->phoneSecondary;
        }

        if ($data->birthDate !== null) {
            $updateData['birth_date'] = $data->birthDate;
        }

        if ($data->gender !== null) {
            $updateData['gender'] = $data->gender;
        }

        if ($data->houseNumber !== null) {
            $updateData['house_number'] = $data->houseNumber;
        }

        if ($data->provinceId !== null) {
            $updateData['province_id'] = $data->provinceId;
        }

        if ($data->wardId !== null) {
            $updateData['ward_id'] = $data->wardId;
        }

        if ($data->isAddressManuallyEdited !== null) {
            $updateData['is_address_manually_edited'] = $data->isAddressManuallyEdited;
        }

        if ($data->avatarPath !== null) {
            $updateData['avatar_path'] = $data->avatarPath;
        }

        if ($data->source !== null) {
            $updateData['source'] = $data->source;
        }

        if ($data->status !== null) {
            $updateData['status'] = $data->status;
        }

        // Resolve address using combined attributes
        $isManual = $data->isAddressManuallyEdited ?? $customer->is_address_manually_edited;
        if ($isManual) {
            if ($data->address !== null) {
                $updateData['address'] = $data->address;
            }
        } else {
            // Re-resolve address if location/house_number parameters are changed
            $combinedData = new StoreCustomerData(
                fullName: $data->fullName ?? $customer->full_name,
                phone: $data->phone ?? $customer->phone,
                phoneSecondary: $data->phoneSecondary ?? $customer->phone_secondary,
                birthDate: $data->birthDate ? (string)$data->birthDate : ($customer->birth_date ? $customer->birth_date->format('Y-m-d') : null),
                gender: $data->gender ?? ($customer->gender ? $customer->gender->value : null),
                houseNumber: $data->houseNumber ?? $customer->house_number,
                provinceId: $data->provinceId ?? $customer->province_id,
                wardId: $data->wardId ?? $customer->ward_id,
                address: $data->address ?? $customer->address,
                isAddressManuallyEdited: false,
                avatarPath: $data->avatarPath ?? $customer->avatar_path,
                source: $data->source ?? ($customer->source ? $customer->source->value : null),
                status: $data->status ?? ($customer->status ? $customer->status->value : null),
            );
            $updateData['address'] = $this->resolveAddress($combinedData);
        }

        $customer->update($updateData);

        return $customer->fresh();
    }

    /**
     * Resolve customer full address from components if not manually edited.
     *
     * @param StoreCustomerData $data
     * @return string|null
     */
    protected function resolveAddress(StoreCustomerData $data): ?string
    {
        if ($data->isAddressManuallyEdited) {
            return $data->address;
        }

        if (!$data->houseNumber && !$data->provinceId && !$data->wardId) {
            return $data->address;
        }

        $parts = [];
        if ($data->houseNumber) {
            $parts[] = $data->houseNumber;
        }

        if ($data->wardId) {
            $ward = \App\Models\Ward::find($data->wardId);
            if ($ward) {
                $parts[] = $ward->name;
            }
        }

        if ($data->provinceId) {
            $province = \App\Models\Province::find($data->provinceId);
            if ($province) {
                $parts[] = $province->name;
            }
        }

        return implode(', ', $parts);
    }

    /**
     * Delete (soft delete) a customer.
     *
     * @param int $id
     * @return void
     * @throws ModelNotFoundException
     */
    public function delete(int $id): void
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();
    }
}
