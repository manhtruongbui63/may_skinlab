<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RegistrationTypeEnum;
use App\Enums\VisitStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * @property int $id
 * @property string $code
 * @property int $queue_number
 * @property int|null $customer_id
 * @property int|null $appointment_id
 * @property int|null $clinic_room_id
 * @property RegistrationTypeEnum $registration_type
 * @property VisitStatusEnum $status
 * @property bool $is_priority
 * @property \Illuminate\Support\Carbon $visited_at
 * @property \Illuminate\Support\Carbon|null $appointment_date
 * @property string|null $reason
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Customer|null $customer
 * @property-read Appointment|null $appointment
 * @property-read ClinicRoom|null $clinicRoom
 * @property-read \Illuminate\Database\Eloquent\Collection<Service> $services
 * @property-read \Illuminate\Database\Eloquent\Collection<ServicePackage> $packages
 * @mixin \Eloquent
 */
class Visit extends Model
{
    /** @use HasFactory<\Database\Factories\VisitFactory> */
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
        'queue_number',
        'customer_id',
        'appointment_id',
        'clinic_room_id',
        'registration_type',
        'status',
        'is_priority',
        'visited_at',
        'appointment_date',
        'reason',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'registration_type' => RegistrationTypeEnum::class,
            'status' => VisitStatusEnum::class,
            'is_priority' => 'boolean',
            'visited_at' => 'datetime',
            'appointment_date' => 'datetime',
            'deleted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Configure the activity log options for the Visit model.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    /**
     * Get the customer that owns the visit.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the appointment associated with the visit.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the clinic room assigned to the visit.
     */
    public function clinicRoom(): BelongsTo
    {
        return $this->belongsTo(ClinicRoom::class);
    }

    /**
     * Get the services selected for this visit.
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'visit_services');
    }

    /**
     * Get the service packages selected for this visit.
     */
    public function packages(): BelongsToMany
    {
        return $this->belongsToMany(ServicePackage::class, 'visit_packages');
    }
}
