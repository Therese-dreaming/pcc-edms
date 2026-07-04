<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.1 `status_history` — polymorphic, drives every workflow diagram in
// docs/1.2, docs/2.2, docs/3.3.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('status_history', function (Blueprint $table) {
            $table->id();
            $table->string('statusable_type');
            $table->unsignedBigInteger('statusable_id');
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by')->constrained('users');
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->index(['statusable_type', 'statusable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('status_history');
    }
};
