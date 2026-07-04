<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.1 `audit_log` — append-only (docs/4.4, FRS §XVI): no update/delete
// permitted at the application layer. No `updated_at` column on purpose — an audit row that can
// be updated isn't an audit row. Application-layer immutability is enforced in
// App\Shared\AuditLog\Models\AuditLog (blocks update/delete via model events).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type');
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('device_info')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['auditable_type', 'auditable_id']);
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log');
    }
};
