<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'sender_type')) {
                $table->string('sender_type')->default('user')->after('conversation_id'); // 'user' or 'employee'
            }
            if (!Schema::hasColumn('messages', 'sender_id')) {
                $table->unsignedBigInteger('sender_id')->nullable()->after('sender_type');
            }
            if (!Schema::hasColumn('messages', 'sender_name')) {
                $table->string('sender_name')->nullable()->after('sender_id');
            }
            if (!Schema::hasColumn('messages', 'sender_role')) {
                $table->string('sender_role')->default('citizen')->after('sender_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['sender_type', 'sender_id', 'sender_name', 'sender_role']);
        });
    }
};
