<?php

namespace App\Shared\Documents\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

// docs/system-design.md §3.1 `documents` — polymorphic, shared across all modules.
// docs/4.2-file-management-naming.md: re-uploads create a new version (old retained,
// is_current_version flips false), soft-delete only, never hard-deleted by non-admin roles.
class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'documentable_type',
        'documentable_id',
        'document_type',
        'file_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'version',
        'uploaded_by',
        'source',
        'is_current_version',
        'archived_at',
    ];

    // FRS §XV lists `Status` as required document metadata. It's derived (not a stored column) from
    // the version/archival flags this table already carries, so it can never drift out of sync:
    //   archived  — superseded version whose file may be purged under the retention policy
    //   current   — the live version
    //   superseded — an older version kept for audit
    protected $appends = ['status'];

    protected function casts(): array
    {
        return [
            'is_current_version' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    protected function status(): Attribute
    {
        return Attribute::make(get: fn() => match (true) {
            $this->archived_at !== null => 'archived',
            $this->is_current_version => 'current',
            default => 'superseded',
        });
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
