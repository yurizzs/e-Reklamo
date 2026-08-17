<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('complaints')
            ->whereIn('status', ['new', 'pending', 'unresolved'])
            ->update(['status' => 'unsettled']);

        DB::table('complaints')
            ->where('status', 'resolved')
            ->update(['status' => 'settled']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('complaints')
            ->where('status', 'unsettled')
            ->update(['status' => 'pending']);

        DB::table('complaints')
            ->where('status', 'settled')
            ->update(['status' => 'resolved']);
    }
};
