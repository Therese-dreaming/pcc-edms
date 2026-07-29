@php
    /**
     * Form 1 — Online Application for Data Privacy and Ethics Review,
     * docs/1.1-dpreq-application-form.md + reqs/DPO EFORM 1 SAMPLE.pdf.
     *
     * Mirrors the official Form 1 layout (the sample-services/dpo-eforms/form1.blade reference,
     * which was never wired into this app — it targets a DpoEform JSON-blob model that doesn't
     * exist here). This version binds to the real relational models instead: the shared
     * ResearchApplication (Section A/B fields) + its DPO-track DpreqApplication (Section III).
     *
     * @var \App\Shared\ResearchApplications\Models\ResearchApplication $researchApplication
     * @var \App\Modules\Dpreq\Models\DpreqApplication $application
     */
    $r = $researchApplication;
    $fmt = fn($value) => filled($value) ? (string) str($value)->replace('_', ' ')->title() : '';
    $dataTypes = collect($application->data_types ?? [])->implode(', ');
    $dataSubjects = collect($application->data_subjects ?? [])->implode(', ');

    // Checklist items 1–2 come from Section A/B; items 3–7 are now answered on the intake and stored
    // in review_checklist (stakeholder 2026-07-28). Item 8 stays a printed declaration.
    $rc = $r->review_checklist ?? [];
    $checklist = [
        ['1', 'Will you have minors as participants? (Minors are respondents below 18 years old.)', $r->minors_involved ? 'yes' : 'no'],
        ['2', 'Do you have an approved letter signed by the head of your target participants?', $r->respondent_head_letter_approved ? 'yes' : 'no'],
        ['3', 'Will the study involve voluntary participation of all respondents?', $rc['voluntary_participation'] ?? null],
        ['4', "Will the participants' identities and responses remain confidential?", $rc['confidentiality'] ?? null],
        ['5', 'Will the participants be free to withdraw anytime without penalty?', $rc['free_withdrawal'] ?? null],
        ['6', 'Will the study avoid exposing participants to harm or risk?', $rc['avoid_harm'] ?? null],
        ['7', 'Will the collected data be used strictly for academic purposes?', $rc['academic_use_only'] ?? null],
        ['8', 'Have you uploaded the required documents in the EDMS (approved letter, Chapter 1, questionnaire, adviser endorsement)?', null],
    ];
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>{{ $application->tracking_number }}</title>
    @include('pdf.partials._styles')
</head>

<body>
    <div class="content-wrapper">

        @include('pdf.partials._header', ['formNumber' => 1, 'formTitle' => 'Online Application for Data Privacy and Ethics Review'])

        <table class="question-table">
            <tr>
                <td class="label">TRACKING NUMBER:</td>
                <td class="answer">{{ $application->tracking_number }}</td>
            </tr>
            <tr>
                <td class="label">DATE SUBMITTED:</td>
                <td class="answer">{{ $application->created_at->format('F j, Y') }}</td>
            </tr>
        </table>

        {{-- Section A/B — research details, two-column Label | Answer (official Form 1 layout) --}}
        <table class="question-table">
            <tr>
                <td class="label">Research Title?</td>
                <td class="answer">{{ $r->research_title }}</td>
            </tr>
            <tr>
                <td class="label">Researcher's name or group lead?</td>
                <td class="answer">{{ $application->applicant->name }}</td>
            </tr>
            <tr>
                <td class="label">Applicant Type?</td>
                <td class="answer">{{ $fmt($application->applicant_type) }}</td>
            </tr>
            <tr>
                <td class="label">How many are doing the research?</td>
                <td class="answer">{{ $r->researcher_count }}</td>
            </tr>
            <tr>
                <td class="label">Adviser's name?</td>
                <td class="answer">{{ $r->adviser_name }}</td>
            </tr>
            <tr>
                <td class="label">Applicant Category?</td>
                <td class="answer">{{ $fmt($r->applicant_category) ?: 'Student' }}</td>
            </tr>
            @if(($r->applicant_category ?? 'student') === 'employee')
                <tr>
                    <td class="label">Department/Office &amp; Position:</td>
                    <td class="answer">
                        <strong>Dept/Office:</strong> {{ $r->department ?: '—' }} |
                        <strong>Position:</strong> {{ $r->position ?: '—' }}
                    </td>
                </tr>
            @else
                <tr>
                    <td class="label">Dept./Level/Course/Section:</td>
                    <td class="answer">
                        <strong>Dept:</strong> {{ $r->department ?: '—' }} |
                        <strong>Level:</strong> {{ $r->level ?: '—' }} |
                        <strong>Course:</strong> {{ $r->course ?: '—' }} |
                        <strong>Section:</strong> {{ $r->section ?: '—' }}
                    </td>
                </tr>
            @endif
            <tr>
                <td class="label">Who are your respondents?</td>
                <td class="answer">{{ $r->respondents }}</td>
            </tr>
            <tr>
                <td class="label">How many are your target respondents?</td>
                <td class="answer">{{ $r->target_respondent_count }}</td>
            </tr>
            <tr>
                <td class="label">Data collection method?</td>
                <td class="answer">{{ $fmt($r->data_collection_method) }}</td>
            </tr>
            <tr>
                <td class="label">Data capturing tool?</td>
                <td class="answer">{{ $fmt($r->data_capturing_tool) }}</td>
            </tr>
            <tr>
                <td class="label">Duration of the research?</td>
                <td class="answer">
                    <strong>Start:</strong> {{ optional($r->target_start_date)->format('n/j/y') ?: '—' }} |
                    <strong>End:</strong> {{ optional($r->target_end_date)->format('n/j/y') ?: '—' }}
                </td>
            </tr>
        </table>

        <div class="spacer-sm"></div>

        {{-- Review checklist --}}
        <div class="text-bold" style="margin-bottom: 4px;">Review Checklist:</div>
        <table class="bordered checklist">
            <thead>
                <tr>
                    <th class="num">#</th>
                    <th>Item</th>
                    <th class="response">Yes</th>
                    <th class="response">No</th>
                    <th class="response">N/A</th>
                </tr>
            </thead>
            <tbody>
                @foreach($checklist as [$num, $text, $resp])
                    <tr>
                        <td class="num">{{ $num }}</td>
                        <td>{{ $text }}</td>
                        <td class="response"><span class="response-circle @if($resp === 'yes') filled @endif"></span></td>
                        <td class="response"><span class="response-circle @if($resp === 'no') filled @endif"></span></td>
                        <td class="response"><span
                                class="response-circle @if($resp === 'not_applicable') filled @endif"></span></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Section III — DPO / Data Privacy review information --}}
        <div class="section-heading">Data Privacy (DPO Review) Information</div>
        <table class="question-table">
            <tr>
                <td class="label">Purpose of Data Collection?</td>
                <td class="answer">{{ $application->purpose ?: '—' }}</td>
            </tr>
            <tr>
                <td class="label">Type of Personal Data Involved?</td>
                <td class="answer">{{ $dataTypes ?: '—' }}</td>
            </tr>
            <tr>
                <td class="label">Data Subjects?</td>
                <td class="answer">{{ $dataSubjects ?: '—' }}</td>
            </tr>
            <tr>
                <td class="label">Data Storage / Retention Plan?</td>
                <td class="answer">{{ $application->retention_plan ?: '—' }}</td>
            </tr>
            <tr>
                <td class="label">Shared with 3rd parties?</td>
                <td class="answer">{{ $application->third_party_sharing ? 'Yes' : 'No' }}</td>
            </tr>
            @if($application->third_party_sharing)
                <tr>
                    <td class="label">Third-party sharing detail?</td>
                    <td class="answer">{{ $application->third_party_detail ?: '—' }}</td>
                </tr>
            @endif
        </table>

        <div class="spacer-sm"></div>

        @include('pdf.partials._certification', ['certified' => true])

        <div class="spacer-md"></div>

        <div class="keep-together">
            {{-- Signature section — two-column table matching the official form --}}
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-label">Researcher's name:</div>
                        <div>{{ $application->applicant->name }}</div>

                        <div class="signature-label" style="margin-top: 6px;">Researcher's signature:</div>
                        @if($r->researcher_signature)
                            <img src="{{ $r->researcher_signature }}" alt="Researcher signature"
                                 style="height: 45px; max-width: 220px; object-fit: contain;">
                        @else
                            <div style="height: 35px;"></div>
                        @endif

                        <div class="signature-label" style="margin-top: 3px;">Date signed:</div>
                        <div>{{ $application->created_at->format('n/j/y') }}</div>
                    </td>
                    <td>
                        <div class="signature-label">Adviser's name:</div>
                        <div>{{ $r->adviser_name }}</div>

                        <div class="signature-label" style="margin-top: 6px;">Adviser's signature:</div>
                        <div style="height: 35px;"></div>

                        <div class="signature-label" style="margin-top: 3px;">Date signed:</div>
                        <div>&nbsp;</div>
                    </td>
                </tr>
            </table>

            <div class="spacer-md"></div>

            @include('pdf.partials._version_control', ['initialVersionDate' => 'April 15, 2026'])

            <div class="spacer-md"></div>

            @include('pdf.partials._approval')
        </div>

    </div>
    @include('pdf.partials._footer', ['documentId' => 'DPO-EFORM-1'])
</body>

</html>