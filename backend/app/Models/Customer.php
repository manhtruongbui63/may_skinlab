<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * @property int $id
 * @property string $code
 * @property string $full_name
 * @property string $phone
 * @property string|null $phone_secondary
 * @property \Illuminate\Support\Carbon|null $birth_date
 * @property GenderEnum|null $gender
 * @property string|null $house_number
 * @property int|null $province_id
 * @property int|null $ward_id
 * @property string|null $address
 * @property bool $is_address_manually_edited
 * @property string|null $avatar_path
 * @property CustomerSourceEnum $source
 * @property CustomerStatusEnum $status
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read int|null $age
 */
class Customer extends Model
{
    /** @use HasFactory<\Database\Factories\CustomerFactory> */
    use HasFactory;
    use SoftDeletes;
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
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
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'gender' => GenderEnum::class,
            'province_id' => 'integer',
            'ward_id' => 'integer',
            'is_address_manually_edited' => 'boolean',
            'source' => CustomerSourceEnum::class,
            'status' => CustomerStatusEnum::class,
            'deleted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Configure the activity log options for the Customer model.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Customer $customer) {
            if (empty($customer->code)) {
                $maxCode = DB::table('customers')
                    ->lockForUpdate()
                    ->max('code');

                $nextNumber = 1;
                if ($maxCode && preg_match('/^BN(\d+)$/', $maxCode, $matches)) {
                    $nextNumber = (int)$matches[1] + 1;
                }

                $customer->code = 'BN' . str_pad((string)$nextNumber, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Accessor for age.
     */
    protected function age(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->birth_date ? now()->year - $this->birth_date->year : null,
        );
    }

    /**
     * Scope a query to only include active customers.
     */
    public function scopeActive($query)
    {
        return $query->where('status', CustomerStatusEnum::ACTIVE->value);
    }

    /**
     * Get the province that the customer belongs to.
     */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    /**
     * Get the ward that the customer belongs to.
     */
    public function ward(): BelongsTo
    {
        return $this->belongsTo(Ward::class);
    }

    /**
     * Get the visits for the customer.
     */
    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }

    /**
     * Get the treatment plans for the customer.
     */
    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    /**
     * Get the invoices for the customer.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get the appointments for the customer.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
