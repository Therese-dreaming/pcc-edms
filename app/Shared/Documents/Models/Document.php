<?php

namespace App\Shared\Documents\Models;

use App\Models\User;
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
        'is_current_version',
    ];

    protected function casts(): array
    {
        return [
            'is_current_version' => 'boolean',
        ];
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
