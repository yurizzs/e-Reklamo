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
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('announcement'); // memorandum, announcement, directive
            $table->string('badge_label')->nullable();
            $table->string('ref_number')->index();
            $table->string('title');
            $table->text('summary');
            $table->string('issuing_office');
            $table->string('date');
            $table->string('effective_date')->nullable();
            $table->string('urgency')->default('routine'); // routine, priority, urgent
            $table->text('legal_basis')->nullable();
            $table->json('key_directives')->nullable();
            $table->json('signatories')->nullable();
            $table->boolean('publish_to_mobile')->default(true);
            $table->boolean('send_push_alert')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
