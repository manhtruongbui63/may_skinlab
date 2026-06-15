<?php

declare(strict_types=1);

use App\Enums\RegistrationTypeEnum;
use App\Enums\VisitStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->smallInteger('queue_number');
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('clinic_room_id')->nullable()->constrained()->nullOnDelete();
            $table->tinyInteger('registration_type')->default(RegistrationTypeEnum::WALK_IN->value);
            $table->tinyInteger('status')->default(VisitStatusEnum::WAITING->value);
            $table->boolean('is_priority')->default(false);
            $table->dateTime('visited_at');
            $table->dateTime('appointment_date')->nullable();
            $table->string('reason', 500)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('appointment_id');
            $table->index('clinic_room_id');
            $table->index('visited_at');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
