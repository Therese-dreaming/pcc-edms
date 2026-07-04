<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.1 `roles` — one row per role in docs/0.2-stakeholders-and-roles.md's
// role list (17 rows: DPO-side + REMIS-side + Admin).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('side', ['dpo', 'remis', 'shared']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
