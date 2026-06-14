<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Gán mã BN cho các bản ghi cũ
        $customers = DB::table('customers')
            ->whereNull('code')
            ->orderBy('id', 'asc')
            ->get();

        $index = 1;
        foreach ($customers as $customer) {
            $code = 'BN' . str_pad((string)$index, 6, '0', STR_PAD_LEFT);
            DB::table('customers')
                ->where('id', $customer->id)
                ->update(['code' => $code]);
            $index++;
        }

        // 2. Chuyển cột code thành NOT NULL
        Schema::table('customers', function (Blueprint $table) {
            $table->string('code', 20)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->change();
        });
    }
};
