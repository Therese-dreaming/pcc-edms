import InputError from '@/Components/InputError';

// A dropdown that offers an "Other (specify)" choice, revealing a free-text field so the applicant
// can describe an answer the fixed options don't capture (stakeholder 2026-07-28). Shared by the
// DPREQ create and edit forms.
export default function SelectWithOther({
    id, label, required = false, value, otherValue,
    onValueChange, onOtherChange, options, error, otherError,
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-bold text-fg-secondary">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <select
                id={id}
                className="mt-1.5 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                <option value="other">Other (specify)</option>
            </select>
            {value === 'other' && (
                <input
                    type="text"
                    aria-label={`${label} — please specify`}
                    placeholder="Please specify"
                    className="mt-2 block w-full rounded-lg border border-border-medium px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-tertiary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10"
                    value={otherValue}
                    onChange={(e) => onOtherChange(e.target.value)}
                />
            )}
            <InputError message={error ?? otherError} className="mt-1.5" />
        </div>
    );
}

// The five closed-dropdown option lists, shared so create and edit stay in lockstep.
export const CHOICE_OPTIONS = {
    research_category: [
        { value: 'academic', label: 'Academic' },
        { value: 'student_thesis', label: 'Student Thesis / Dissertation' },
        { value: 'faculty', label: 'Faculty Research' },
        { value: 'institutional', label: 'Institutional' },
        { value: 'sponsored', label: 'Sponsored' },
    ],
    data_collection_method: [
        { value: 'survey_form', label: 'Survey form' },
        { value: 'interview', label: 'Interview' },
        { value: 'mixed', label: 'Mixed' },
        { value: 'observation', label: 'Observation' },
    ],
    data_capturing_tool: [
        { value: 'electronic_form', label: 'Electronic form' },
        { value: 'paper_based', label: 'Paper-based' },
        { value: 'voice_recording', label: 'Voice recording' },
        { value: 'video_recording', label: 'Video recording' },
    ],
    study_type: [
        { value: 'thesis_dissertation', label: 'Thesis/Dissertation' },
        { value: 'faculty_research', label: 'Faculty Research' },
        { value: 'institutional', label: 'Institutional' },
        { value: 'sponsored', label: 'Sponsored' },
    ],
    study_design: [
        { value: 'quantitative', label: 'Quantitative' },
        { value: 'qualitative', label: 'Qualitative' },
        { value: 'mixed_methods', label: 'Mixed Methods' },
    ],
};

// Split a stored value into [selectValue, otherText]: a known token selects itself; anything else is
// an "other" free-text answer (used when prefilling the edit form).
export function splitChoice(value, field) {
    const known = (CHOICE_OPTIONS[field] ?? []).map((o) => o.value);
    if (value && known.includes(value)) return [value, ''];
    if (value) return ['other', value];
    return [known[0] ?? '', ''];
}
