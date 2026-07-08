<?php

namespace App\Modules\Dpnda\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// docs/2.1-dpnda-nda-template.md §2.1.b — Form 5 fields.
class StorePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Modules\Dpnda\Models\DpndaRecord::class);
    }

    public function rules(): array
    {
        return [
            'trainee_email' => ['required', 'email', 'exists:users,email'],
            'trainee_last_name' => ['required', 'string', 'max:255'],
            'trainee_first_name' => ['required', 'string', 'max:255'],
            'trainee_middle_initial' => ['nullable', 'string', 'max:10'],
            'gender' => ['nullable', 'string', 'max:50'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'enrolled_school' => ['required', 'string', 'max:255'],
            'hours_needed' => ['nullable', 'integer', 'min:1'],
            'trainee_type' => ['required', 'in:internal_ojt,external_ojt,community_service'],
            'department' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'address_house_no' => ['nullable', 'string', 'max:255'],
            'address_street' => ['nullable', 'string', 'max:255'],
            'address_barangay' => ['nullable', 'string', 'max:255'],
            'address_city' => ['nullable', 'string', 'max:255'],
            'department_assigned' => ['required', 'string', 'max:255'],
            'pcc_supervisor' => ['nullable', 'string', 'max:255'],
            'endorsed_by' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'guardian_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
