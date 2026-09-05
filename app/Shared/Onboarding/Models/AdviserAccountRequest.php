<?php

namespace App\Shared\Onboarding\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A pending "give me an adviser account" request from an external adviser, reviewed by the DPO/admin
// (stakeholder 2026-07-28). See the create-requests migration for the why.
class AdviserAccountRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'account_type',
        'institution',
        'department',
        'purpose',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'created_user_id',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function createdUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_user_id');
    }
}
