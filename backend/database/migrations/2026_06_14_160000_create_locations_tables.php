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
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->timestamps();
        });

        Schema::create('wards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('province_id')
                ->constrained('provinces')
                ->cascadeOnDelete();
            $table->string('name', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wards');
        Schema::dropIfExists('provinces');
    }
};
