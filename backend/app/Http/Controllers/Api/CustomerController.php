<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTOs\Api\Customer\IndexCustomerData;
use App\DTOs\Api\Customer\StoreCustomerData;
use App\DTOs\Api\Customer\UpdateCustomerData;
use App\Factories\ApiFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\IndexCustomerRequest;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\Customer\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Controller for Customer API endpoints.
 */
class CustomerController extends Controller
{
    /**
     * Get paginated list of customers.
     *
     * @param IndexCustomerRequest $request
     * @return JsonResponse
     */
    public function index(IndexCustomerRequest $request): JsonResponse
    {
        $data = IndexCustomerData::from($request->validated());
        $customers = ApiFactory::getCustomerService()->list($data);

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => CustomerResource::collection($customers),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    /**
     * Get customer detail.
     *
     * @param Customer $customer
     * @return JsonResponse
     */
    public function show(Customer $customer): JsonResponse
    {
        Gate::authorize('view', $customer);

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => new CustomerResource($customer),
        ]);
    }

    /**
     * Create a new customer.
     *
     * @param StoreCustomerRequest $request
     * @return JsonResponse
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        Gate::authorize('create', Customer::class);

        $data = StoreCustomerData::from($request->validated());
        $customer = ApiFactory::getCustomerService()->create($data);

        return response()->json([
            'success' => true,
            'message' => trans('messages.customer.created'),
            'errors' => null,
            'data' => new CustomerResource($customer),
        ], 201);
    }

    /**
     * Update a customer.
     *
     * @param UpdateCustomerRequest $request
     * @param Customer $customer
     * @return JsonResponse
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        Gate::authorize('update', $customer);

        $data = UpdateCustomerData::from($request->validated());
        $customer = ApiFactory::getCustomerService()->update($customer->id, $data);

        return response()->json([
            'success' => true,
            'message' => trans('messages.customer.updated'),
            'errors' => null,
            'data' => new CustomerResource($customer),
        ]);
    }

    /**
     * Delete (soft delete) a customer.
     *
     * @param Customer $customer
     * @return JsonResponse
     */
    public function destroy(Customer $customer): JsonResponse
    {
        Gate::authorize('delete', $customer);

        ApiFactory::getCustomerService()->delete($customer->id);

        return response()->json([
            'success' => true,
            'message' => trans('messages.customer.deleted'),
            'errors' => null,
            'data' => null,
        ], 204);
    }

    /**
     * Get customer visits.
     *
     * @param Customer $customer
     * @return JsonResponse
     */
    public function visits(Customer $customer): JsonResponse
    {
        // Mock data for phase 2/3 validation since Visit model belongs to a later phase
        $mockVisits = [
            [
                'id' => 1,
                'customer_id' => $customer->id,
                'visit_date' => '2026-06-10',
                'doctor_name' => 'Dr. Nguyễn Văn Kiểm',
                'notes' => 'Khám định kỳ răng miệng',
                'diagnosis' => 'Sâu răng nhẹ răng 36',
            ],
            [
                'id' => 2,
                'customer_id' => $customer->id,
                'visit_date' => '2026-06-12',
                'doctor_name' => 'Dr. Nguyễn Văn Kiểm',
                'notes' => 'Trám răng sâu',
                'diagnosis' => 'Trám răng 36 hoàn tất',
            ],
        ];

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => $mockVisits,
        ]);
    }

    /**
     * Get customer treatment plans.
     *
     * @param Customer $customer
     * @return JsonResponse
     */
    public function treatmentPlans(Customer $customer): JsonResponse
    {
        // Mock data for phase 2/3 validation since TreatmentPlan model belongs to a later phase
        $mockPlans = [
            [
                'id' => 1,
                'customer_id' => $customer->id,
                'plan_name' => 'Điều trị sâu răng',
                'status' => 'Completed',
                'start_date' => '2026-06-10',
                'end_date' => '2026-06-12',
            ],
            [
                'id' => 2,
                'customer_id' => $customer->id,
                'plan_name' => 'Niềng răng mắc cài kim loại',
                'status' => 'In Progress',
                'start_date' => '2026-06-05',
                'end_date' => null,
            ],
        ];

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => $mockPlans,
        ]);
    }

    /**
     * Get customer invoices.
     *
     * @param Customer $customer
     * @return JsonResponse
     */
    public function invoices(Customer $customer): JsonResponse
    {
        // Mock data for phase 2/3 validation since Invoice model belongs to a later phase
        $mockInvoices = [
            [
                'id' => 1,
                'customer_id' => $customer->id,
                'invoice_number' => 'HD-2026-0001',
                'amount' => 500000,
                'paid_amount' => 500000,
                'outstanding_amount' => 0,
                'issue_date' => '2026-06-12',
                'status' => 'Paid',
            ],
            [
                'id' => 2,
                'customer_id' => $customer->id,
                'invoice_number' => 'HD-2026-0002',
                'amount' => 30000000,
                'paid_amount' => 5000000,
                'outstanding_amount' => 25000000,
                'issue_date' => '2026-06-05',
                'status' => 'Partially Paid',
            ],
        ];

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => $mockInvoices,
        ]);
    }
}
