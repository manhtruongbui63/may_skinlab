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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->unique()->after('id');
            $table->string('phone_secondary', 50)->nullable()->after('phone');
            $table->string('house_number', 255)->nullable()->after('gender');
            $table->foreignId('province_id')
                ->nullable()
                ->after('house_number')
                ->constrained('provinces')
                ->nullOnDelete();
            $table->foreignId('ward_id')
                ->nullable()
                ->after('province_id')
                ->constrained('wards')
                ->nullOnDelete();
            $table->boolean('is_address_manually_edited')->default(false)->after('address');
            $table->string('avatar_path', 255)->nullable()->after('is_address_manually_edited');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['ward_id']);
            $table->dropForeign(['province_id']);
            $table->dropColumn([
                'code',
                'phone_secondary',
                'house_number',
                'province_id',
                'ward_id',
                'is_address_manually_edited',
                'avatar_path',
            ]);
        });
    }
};
