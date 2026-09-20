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
        Schema::table('chatbot_knowledge', function (Blueprint $table) {
            $table->string('keyword')->nullable()->change();
            $table->text('response')->nullable()->change();
            
            $table->string('title')->nullable()->after('id');
            $table->string('category')->nullable()->after('title');
            $table->text('keywords')->nullable()->after('category');
            $table->text('content')->nullable()->after('keywords');
            $table->decimal('fine_amount', 10, 2)->nullable()->after('content');
            $table->string('ordinance_ref')->nullable()->after('fine_amount');
            $table->boolean('is_active')->default(true)->after('ordinance_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chatbot_knowledge', function (Blueprint $table) {
            $table->dropColumn([
                'title',
                'category',
                'keywords',
                'content',
                'fine_amount',
                'ordinance_ref',
                'is_active',
            ]);
        });
    }
};
