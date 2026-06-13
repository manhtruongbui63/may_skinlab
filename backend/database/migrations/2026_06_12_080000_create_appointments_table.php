<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->dateTime('appointment_at');
            $table->date('appointment_date');
            $table->tinyInteger('status')->default(1); // Mặc định BOOKED = 1
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['appointment_date', 'status']);
            $table->index('customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
