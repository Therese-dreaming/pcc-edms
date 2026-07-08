<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.3 `placements` — the first-class OJT/Trainee placement entity
// docs/5.3 recommended instead of deriving reports from a signed PDF. Fields match
// docs/2.1-dpnda-nda-template.md §2.1.b (Form 5, reqs/DPO EFORM 5 SAMPLE.pdf).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainee_id')->constrained('users');
            $table->string('trainee_last_name');
            $table->string('trainee_first_name');
            $table->string('trainee_middle_initial')->nullable();
            $table->string('gender')->nullable();
            $table->unsignedTinyInteger('age')->nullable();
            $table->string('enrolled_school');
            $table->unsignedInteger('hours_needed')->nullable();
            $table->enum('trainee_type', ['internal_ojt', 'external_ojt', 'community_service']);
            $table->string('department')->nullable();
            $table->string('level')->nullable();
            $table->string('course')->nullable();
            $table->string('section')->nullable();
            $table->string('address_house_no')->nullable();
            $table->string('address_street')->nullable();
            $table->string('address_barangay')->nullable();
            $table->string('address_city')->nullable();
            $table->string('department_assigned');
            $table->string('pcc_supervisor')->nullable();
            $table->string('endorsed_by')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->foreignId('coordinator_id')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('placements');
    }
};
