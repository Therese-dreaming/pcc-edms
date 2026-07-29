<?php

namespace App\Shared\Revisions\Models;

use App\Models\User;
use App\Shared\Documents\Models\Document;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// FRS §IX — the applicant's reply to a revision request (text and/or a revised document).
class RevisionResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'revision_request_id',
        'response',
        'document_id',
        'responded_by',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(RevisionRequest::class, 'revision_request_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}
