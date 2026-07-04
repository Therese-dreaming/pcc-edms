@php
/**
 * Shared helper for DPO EFORM PDF templates.
 *
 * Include this once at the top of a form template:
 *   @include('dpo-eforms._partials', ['eform' => $eform, 'type' => $type])
 *
 * It exposes the $prefixId and $initialVersion variables and is included
 * purely for its side effects / variable setup. Layout fragments are
 * pulled in via the dedicated sub-templates below.
 */

$prefixId = $type->documentIdPrefix();

// Form 5 uses a different initial version date than the other forms
$initialVersion = $type === \App\Enums\DpoEformType::Form5
    ? config('remis.dpo_eforms.initial_version_form5')
    : config('remis.dpo_eforms.initial_version');

/**
 * Render a checklist response cell.
 */
$__renderResponse = function ($value) {
    return $value === 'yes' || $value === 'no' || $value === 'not_applicable' ? 'X' : '';
};
@endphp
