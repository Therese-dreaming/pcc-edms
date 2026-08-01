<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// The decisions.outcome enum was originally created with only four values
// (approved/approved_with_conditions/deferred/disapproved), but the workflow also supports
// a "for_revision" decision from the for_review stage (RemisWorkflowService::decide() +
// RemisApplicationController validation). Without this value in the enum the Chair gets a
// DB constraint violation when issuing a revise-and-resubmit decision — a dead-end.
return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN / MODIFY on enums — it uses CHECK constraints.
        // Laravel's enum() on SQLite creates a varchar with a CHECK. We need to recreate the
        // constraint. On MySQL this would be a simple MODIFY COLUMN.
        if (DB::getDriverName() === 'sqlite') {
            // For SQLite (testing), we drop and re-add the check constraint via table rebuild.
            // Laravel's schema builder doesn't expose CHECK manipulation, so we use raw SQL.
            // The table is small and this runs once in migration history.
            DB::statement("PRAGMA foreign_keys = OFF");

            // Read current table SQL, replace the CHECK constraint.
            $sql = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='decisions'")[0]->sql ?? '';

            if (str_contains($sql, "'approved', 'approved_with_conditions', 'deferred', 'disapproved'")) {
                $newSql = str_replace(
                    "'approved', 'approved_with_conditions', 'deferred', 'disapproved'",
                    "'approved', 'approved_with_conditions', 'deferred', 'disapproved', 'for_revision'",
                    $sql,
                );

                DB::statement("ALTER TABLE decisions RENAME TO decisions_old");
                DB::statement($newSql);
                DB::statement("INSERT INTO decisions SELECT * FROM decisions_old");
                DB::statement("DROP TABLE decisions_old");
            }

            DB::statement("PRAGMA foreign_keys = ON");
        } else {
            // MySQL / PostgreSQL — modify the enum column directly.
            DB::statement("ALTER TABLE decisions MODIFY COLUMN outcome ENUM('approved', 'approved_with_conditions', 'deferred', 'disapproved', 'for_revision') NOT NULL");
        }
    }

    public function down(): void
    {
        // Irreversible in practice (would fail if any for_revision decisions exist).
        // Left as a no-op; rollback of enum narrowing is not safe.
    }
};
