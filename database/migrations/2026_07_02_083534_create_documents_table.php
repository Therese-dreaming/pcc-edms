<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/system-design.md §3.1 `documents` — polymorphic, shared across all modules.
// docs/4.2-file-management-naming.md: re-uploads create a new version (old retained,
// is_current_version flips), and deletion is soft-delete only.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('documentable_type');
            $table->unsignedBigInteger('documentable_id');
            $table->string('document_type');
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->unsignedInteger('version')->default(1);
            $table->foreignId('uploaded_by')->constrained('users');
            $table->boolean('is_current_version')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['documentable_type', 'documentable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
