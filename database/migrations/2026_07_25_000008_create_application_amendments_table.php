<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Tracked amendments (confirmed edit policy, 2026-07-25): an applicant may edit a submitted answer
// ONLY while the application is returned/for_revision, and every change is recorded here as
// old -> new + reason. The original submission is never silently overwritten — this table plus the
// audit log preserve the full history of what changed and why. Polymorphic across both tracks.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_amendments', function (Blueprint $table) {
            $table->id();
            $table->morphs('amendable'); // RemisApplication or DpreqApplication
            $table->string('field');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('amended_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_amendments');
    }
};
