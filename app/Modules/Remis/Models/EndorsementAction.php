<?php

namespace App\Modules\Remis\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// docs/3.3-remis-review-workflow.md FRS §IV — one row per endorsement step per attempt.
class EndorsementAction extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'remis_application_id',
        'step',
        'endorser_id',
        'action',
        'remarks',
        'signature_id',
        'signature_image',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'acted_at' => 'datetime',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    public function endorser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'endorser_id');
    }
}
