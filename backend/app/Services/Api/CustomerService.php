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
            ->select([
                'id',
                'full_name',
                'phone',
                'birth_date',
                'gender',
                'address',
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

        // Apply gender filter
        if ($data->gender !== null) {
            $query->where('gender', $data->gender);
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
        return Customer::findOrFail($id);
    }

    /**
     * Create a new customer.
     *
     * @param StoreCustomerData $data
     * @return Customer
     */
    public function create(StoreCustomerData $data): Customer
    {
        return Customer::create([
            'full_name' => $data->fullName,
            'phone' => $data->phone,
            'birth_date' => $data->birthDate,
            'gender' => $data->gender,
            'address' => $data->address,
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

        if ($data->birthDate !== null) {
            $updateData['birth_date'] = $data->birthDate;
        }

        if ($data->gender !== null) {
            $updateData['gender'] = $data->gender;
        }

        if ($data->address !== null) {
            $updateData['address'] = $data->address;
        }

        if ($data->source !== null) {
            $updateData['source'] = $data->source;
        }

        if ($data->status !== null) {
            $updateData['status'] = $data->status;
        }

        $customer->update($updateData);

        return $customer->fresh();
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
