<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('operator_schedules', function (Blueprint $table) {
            $table->string('attendance_status')->default('pending')->after('status');
            $table->timestamp('verified_at')->nullable()->after('attendance_status');
            $table->string('verification_method')->nullable()->after('verified_at');
            $table->decimal('confidence_score', 5, 2)->nullable()->after('verification_method');
            $table->unsignedBigInteger('confirmed_by')->nullable()->after('confidence_score');
            $table->text('emergency_reason')->nullable()->after('confirmed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operator_schedules', function (Blueprint $table) {
            $table->dropColumn([
                'attendance_status',
                'verified_at',
                'verification_method',
                'confidence_score',
                'confirmed_by',
                'emergency_reason',
            ]);
        });
    }
};
