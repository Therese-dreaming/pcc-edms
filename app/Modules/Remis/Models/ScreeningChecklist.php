<?php

namespace App\Modules\Remis\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// FRS §VI — one administrative-screening record for a REMIS application.
class ScreeningChecklist extends Model
{
    use HasFactory;

    // The five FRS §VI checkbox fields, in display order.
    public const ITEMS = [
        'proposal_attached' => 'Proposal Attached',
        'consent_form_attached' => 'Consent Form Attached',
        'instrument_attached' => 'Instrument Attached',
        'signatures_complete' => 'Signatures Complete',
        'required_templates_used' => 'Required Templates Used',
    ];

    protected $fillable = [
        'remis_application_id',
        'proposal_attached',
        'consent_form_attached',
        'instrument_attached',
        'signatures_complete',
        'required_templates_used',
        'decision',
        'comments',
        'screened_by',
        'screened_at',
    ];

    protected function casts(): array
    {
        return [
            'proposal_attached' => 'boolean',
            'consent_form_attached' => 'boolean',
            'instrument_attached' => 'boolean',
            'signatures_complete' => 'boolean',
            'required_templates_used' => 'boolean',
            'screened_at' => 'datetime',
        ];
    }

    public function remisApplication(): BelongsTo
    {
        return $this->belongsTo(RemisApplication::class);
    }

    public function screener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'screened_by');
    }

    /** Checklist items that were NOT ticked — the deficiencies. */
    public function deficiencies(): array
    {
        return array_values(array_filter(
            array_map(fn ($key, $label) => $this->{$key} ? null : $label, array_keys(self::ITEMS), self::ITEMS),
        ));
    }
}
