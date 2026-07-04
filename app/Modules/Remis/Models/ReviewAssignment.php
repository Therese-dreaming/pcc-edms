<?php

namespace App\Modules\Remis\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/3.3-remis-review-workflow.md FRS §VIII.
class ReviewAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'remis_application_id',
        'reviewer_id',
        'assigned_at',
        'recommendation',
        'comments',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
