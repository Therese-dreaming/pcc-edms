<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Trainee self-service weekly whereabouts (OJT "where will you be" schedule). Layers on top of
// the coordinator-created `placements` record: the placement defines the overall deployment
// period, and the trainee fills in their recurring weekly pattern (day + time block + location).
// The DPNDA deployment calendar visualizes these blocks within the placement period. `day_of_week`
// is 0=Sunday..6=Saturday to match JavaScript's Date.getDay() used by the calendar grid.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainee_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('placement_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sunday..6=Saturday
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location'); // department/office/area for this block
            $table->text('notes')->nullable();
            $table->timestamps();

            // A trainee can't double-book the exact same block; distinct overlapping blocks on the
            // same day are allowed (e.g. morning at Registrar, afternoon at Library).
            $table->unique(['placement_id', 'day_of_week', 'start_time', 'end_time', 'location'], 'schedules_unique_block');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainee_schedules');
    }
};
