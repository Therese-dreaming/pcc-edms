<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// File Management System (DPO / System Administrator) — the tree's top-level split is
// "Generated Documents (system forms)" vs "Submitted Files (applicant uploads)". The two
// DocumentService entry points already correspond to that split (storeGenerated() vs store()),
// but nothing was persisted to tell them apart after the fact. `source` is that flag.
//
// Backfill heuristic: DocumentService::storeGenerated() writes the standardized REC-... name into
// BOTH file_path and original_filename, whereas store() keeps the applicant's real client filename
// in original_filename. So an original_filename beginning with "REC-" is a system-generated file.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('source')->default('submitted')->after('uploaded_by');
            $table->index('source');
        });

        DB::table('documents')
            ->where('original_filename', 'like', 'REC-%')
            ->update(['source' => 'generated']);
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropColumn('source');
        });
    }
};
