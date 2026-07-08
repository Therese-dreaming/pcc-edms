<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Dpnda\Services\DpndaWorkflowService;
use App\Modules\Dpnda\Services\OjtEvaluationReportService;
use App\Modules\Dpreq\Services\DpreqWorkflowService;
use App\Modules\Dpreq\Services\ResearchTeamNdaService;
use App\Modules\Remis\Incident\Services\IncidentService;
use App\Modules\Remis\Monitoring\Services\RemisMonitoringService;
use App\Modules\Remis\Services\RemisWorkflowService;
use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Services\ResearchApplicationService;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

// docs/5.1-5.3 — demo data so the Reporting module has something to show. Drives every record
// through its real workflow service (docs/9.0 step 5 pattern), not raw inserts, so status_history
// / audit_log / legal-transition invariants stay intact exactly as they would from live use.
// Every workflow service resolves the acting user via Auth::id() (it's normally called from an
// authenticated HTTP request), so this seeder calls Auth::onceUsingId() before each action to
// stand in for whichever role would really perform it.
class ReportDemoSeeder extends Seeder
{
    private array $userIds = [];

    public function run(
        ResearchApplicationService $researchApplications,
        DpreqWorkflowService $dpreqWorkflow,
        RemisWorkflowService $remisWorkflow,
        DpndaWorkflowService $dpndaWorkflow,
        IncidentService $incidents,
        ResearchTeamNdaService $researchTeamNda,
        RemisMonitoringService $monitoring,
        OjtEvaluationReportService $evaluationReports,
    ): void {
        $this->seedExtraUsers();

        // --- Research applications (DPREQ + REMIS), spread across departments/statuses ---
        $apps = [
            $this->submitApplication($researchApplications, 'College of Education', 'Reading Habits of Grade 10 Students'),
            $this->submitApplication($researchApplications, 'College of Education', 'Peer Mentoring and Academic Performance'),
            $this->submitApplication($researchApplications, 'College of Business', 'Consumer Behavior in Online Retail'),
            $this->submitApplication($researchApplications, 'College of Business', 'Financial Literacy Among Working Students'),
            $this->submitApplication($researchApplications, 'Senior High School', 'Screen Time and Sleep Quality of SHS Students'),
            $this->submitApplication($researchApplications, 'Senior High School', 'Stress Coping Mechanisms During Exams'),
        ];

        Auth::onceUsingId($this->userIds['dpo_staff']);

        // DPREQ track: spread across the pending statuses the "Pending DPO Approvals" report reads.
        $dpreqWorkflow->startScreening($apps[1]);

        $dpreqWorkflow->startScreening($apps[2]);
        $dpreqWorkflow->returnForCorrection($apps[2], 'Data retention plan does not specify a disposal date.');

        $dpreqWorkflow->startScreening($apps[3]);
        $dpreqWorkflow->passScreeningToReview($apps[3]);

        $dpreqWorkflow->startScreening($apps[4]);
        $dpreqWorkflow->passScreeningToReview($apps[4]);
        $dpreqWorkflow->endorse($apps[4], 'Compliant with DPO-POL-005, ready for approver sign-off.');

        $dpreqWorkflow->startScreening($apps[5]);
        $dpreqWorkflow->passScreeningToReview($apps[5]);
        $dpreqWorkflow->reject($apps[5], 'Respondent head letter not approved.');
        // $apps[0] left at 'submitted'.

        // REMIS track: drive each through endorsement to a mix of outcomes for risk/reviewer/annual reports.
        $this->endorseThroughToScreening($remisWorkflow, $apps[1]->researchApplication->remisApplication);
        $this->endorseThroughToScreening($remisWorkflow, $apps[2]->researchApplication->remisApplication);
        $this->endorseThroughToScreening($remisWorkflow, $apps[3]->researchApplication->remisApplication);
        $this->endorseThroughToScreening($remisWorkflow, $apps[4]->researchApplication->remisApplication);
        // $apps[0], $apps[5] remisApplications left at 'under_endorsement' (pending).

        Auth::onceUsingId($this->userIds['secretariat']);
        $remis1 = $apps[1]->researchApplication->remisApplication->fresh();
        $remisWorkflow->screen($remis1, 'complete');
        $remis2 = $apps[2]->researchApplication->remisApplication->fresh();
        $remisWorkflow->screen($remis2, 'complete');
        $remis3 = $apps[3]->researchApplication->remisApplication->fresh();
        $remisWorkflow->screen($remis3, 'complete');
        $remis4 = $apps[4]->researchApplication->remisApplication->fresh();
        $remisWorkflow->screen($remis4, 'complete');

        Auth::onceUsingId($this->userIds['chair']);
        $assignment1 = $remisWorkflow->assignReviewer($remis1->fresh(), $this->userIds['reviewer']);
        $assignment2 = $remisWorkflow->assignReviewer($remis2->fresh(), $this->userIds['reviewer']);
        $assignment3 = $remisWorkflow->assignReviewer($remis3->fresh(), $this->userIds['reviewer']);
        $remisWorkflow->assignReviewer($remis4->fresh(), $this->userIds['reviewer']);
        // remis4's assignment is left active (unsubmitted) for the Reviewer Workload report.

        Auth::onceUsingId($this->userIds['reviewer']);
        $remisWorkflow->classifyRiskAndRecommend($assignment1, 'minimal', 'Anonymous survey, no sensitive data.', 'approve', 'Well-designed instrument.');
        $remisWorkflow->classifyRiskAndRecommend($assignment2, 'moderate', 'Involves minors as respondents.', 'minor_revision', 'Clarify consent process.');
        $remisWorkflow->classifyRiskAndRecommend($assignment3, 'high', 'Financial data from vulnerable population.', 'disapprove', 'Insufficient safeguards.');

        Auth::onceUsingId($this->userIds['chair']);
        $remisWorkflow->decide($remis1->fresh(), 'approved', $this->userIds['chair'], null, 'Approved as submitted.', 'Connie Chair');
        $remisWorkflow->decide($remis2->fresh(), 'deferred', $this->userIds['chair'], null, 'Resubmit with parental consent forms.', 'Connie Chair');
        $remisWorkflow->decide($remis3->fresh(), 'disapproved', $this->userIds['chair'], null, 'Data security plan inadequate.', 'Connie Chair');

        // --- Incidents, for the Incident Summary report and DPO cross-notification ---
        Auth::onceUsingId($this->userIds['secretariat']);
        $incident1 = $incidents->file($remis1->fresh(), [
            'incident_type' => 'data_breach',
            'severity' => 'high',
            'incident_date' => now()->subDays(10)->toDateString(),
            'description' => 'Survey response spreadsheet briefly shared with an unauthorized mailing list.',
            'immediate_actions' => 'Recalled the email, revoked sharing link.',
        ], $this->userIds['secretariat']);
        $incidents->transition($incident1, 'under_investigation');
        $incidents->transition($incident1, 'resolved');
        $incidents->transition($incident1, 'closed');

        $incident2 = $incidents->file($remis2->fresh(), [
            'incident_type' => 'participant_complaint',
            'severity' => 'low',
            'incident_date' => now()->subDays(2)->toDateString(),
            'description' => 'A respondent requested clarification on how their data will be used.',
        ], $this->userIds['secretariat']);
        $incidents->transition($incident2, 'under_investigation');

        // --- Placements + DPNDA (OJT/Trainee), for the DPO reports. "Student teacher" is not a
        // placement type PCC tracks separately from OJT (stakeholder-confirmed) — the two former
        // student-teacher demo rows below are ordinary internal/external OJT placements.
        $placements = [
            ['type' => 'internal_ojt', 'school' => 'Pasig Catholic College', 'dept' => 'Registrar', 'level' => 'Grade 12', 'trainee' => 'trainee@pcc.test', 'start' => now()->subMonths(2), 'end' => now()->addMonth()],
            ['type' => 'external_ojt', 'school' => 'University of Rizal System', 'dept' => 'IT Office', 'level' => '3rd Year', 'trainee' => 'ojt.external@pcc.test', 'start' => now()->subMonth(), 'end' => now()->addMonths(2)],
            ['type' => 'external_ojt', 'school' => 'Rizal Technological University', 'dept' => 'Library', 'level' => '4th Year', 'trainee' => 'ojt.external2@pcc.test', 'start' => now()->subMonths(3), 'end' => now()->subMonth()],
            ['type' => 'internal_ojt', 'school' => 'Pasig Catholic College', 'dept' => 'Grade School', 'level' => 'Grade 4', 'trainee' => 'student.teacher@pcc.test', 'start' => now()->subWeeks(3), 'end' => now()->addMonths(2)],
            ['type' => 'external_ojt', 'school' => 'Colegio de San Juan de Letran', 'dept' => 'Senior High School', 'level' => 'Grade 11', 'trainee' => 'student.teacher2@pcc.test', 'start' => now()->subWeek(), 'end' => now()->addMonths(3)],
        ];

        Auth::onceUsingId($this->userIds['coordinator']);

        $placementRecords = [];

        foreach ($placements as $i => $p) {
            $record = $dpndaWorkflow->createPlacement([
                'trainee_id' => $this->userIds[$p['trainee']],
                'trainee_last_name' => 'Trainee'.$i,
                'trainee_first_name' => 'Demo',
                'enrolled_school' => $p['school'],
                'trainee_type' => $p['type'],
                'department' => $p['dept'],
                'level' => $p['level'],
                'department_assigned' => $p['dept'],
                'start_date' => $p['start']->toDateString(),
                'end_date' => $p['end']->toDateString(),
            ], $this->userIds['coordinator']);

            $placementRecords[$i] = $record;

            // Complete the first three so the "accomplished NDAs" report has real rows;
            // leave the rest in-flight for status diversity.
            if ($i < 3) {
                $dpndaWorkflow->sendForSigning($record);
                Auth::onceUsingId($this->userIds[$p['trainee']]);
                $dpndaWorkflow->traineeSign($record, 'Demo Trainee'.$i);
                Auth::onceUsingId($this->userIds['coordinator']);
                $dpndaWorkflow->coordinatorCountersign($record, 'Cathy Coordinator');
            } elseif ($i === 3) {
                $dpndaWorkflow->sendForSigning($record);
            }
        }

        // docs/5.3 "Offices/departments that have uploaded OJT evaluation reports" — upload for
        // 2 of the 5 placements (Registrar, Library) so the report has both compliant and
        // non-compliant departments to show (IT Office/Grade School/Senior High School don't).
        Auth::onceUsingId($this->userIds['coordinator']);
        foreach ([0, 2] as $i) {
            $evaluationReports->upload(
                $placementRecords[$i]->placement,
                UploadedFile::fake()->create("evaluation-report-{$i}.pdf", 50, 'application/pdf'),
                'Trainee performed satisfactorily throughout the placement.',
                $this->userIds['coordinator'],
            );
        }

        // --- Full clearance -> monitoring -> completion -> archived lifecycle (docs/3.4),
        // giving the Compliance Monitoring / Archive Studies reports (docs/5.1, 5.2) and the
        // "archived_count"/monitoring figures on the Annual Ethics Report real data to show.
        $app6 = $this->submitApplication($researchApplications, 'College of Education', 'Digital Literacy Intervention Study');

        Auth::onceUsingId($this->userIds['researcher']);
        $leaderSignatory = $app6->researchApplication->researchTeamNda->signatories()->first();
        $researchTeamNda->sign($leaderSignatory, 'Rosa Researcher');

        Auth::onceUsingId($this->userIds['dpo_staff']);
        $dpreqWorkflow->startScreening($app6);
        $dpreqWorkflow->passScreeningToReview($app6);
        $dpreqWorkflow->endorse($app6, 'Fully compliant, NDA signed.');

        Auth::onceUsingId($this->userIds['dpo_staff']);
        $dpreqWorkflow->approve($app6->fresh(), $this->userIds['dpo_staff']);

        $this->endorseThroughToScreening($remisWorkflow, $app6->researchApplication->remisApplication);

        Auth::onceUsingId($this->userIds['secretariat']);
        $remis6 = $app6->researchApplication->remisApplication->fresh();
        $remisWorkflow->screen($remis6, 'complete');

        Auth::onceUsingId($this->userIds['chair']);
        $assignment6 = $remisWorkflow->assignReviewer($remis6->fresh(), $this->userIds['reviewer']);

        Auth::onceUsingId($this->userIds['reviewer']);
        $remisWorkflow->classifyRiskAndRecommend($assignment6, 'minimal', 'Standard survey-based study.', 'approve', 'Approved.');

        Auth::onceUsingId($this->userIds['chair']);
        $remisWorkflow->decide($remis6->fresh(), 'approved', $this->userIds['chair'], null, 'Approved.', 'Connie Chair');

        // Both tracks are now clearance_issued; ClearanceService auto-advances REMIS to
        // `monitoring` (docs/3.4 — see ClearanceService::startMonitoring()).
        Auth::onceUsingId($this->userIds['researcher']);
        $progress = $monitoring->submitProgressReport($remis6->fresh(), [
            'status_of_study' => 'Data collection ongoing',
            'participants_recruited' => 40,
        ], $this->userIds['researcher']);

        Auth::onceUsingId($this->userIds['reviewer']);
        $monitoring->reviewProgressReport($progress, 'compliant', 'On track, no concerns.', $this->userIds['reviewer']);

        Auth::onceUsingId($this->userIds['researcher']);
        $monitoring->submitCompletionReport($remis6->fresh(), [
            'completion_date' => now()->toDateString(),
            'final_participant_count' => 100,
            'compliance_statement' => 'Study completed in full compliance with the approved protocol.',
            'publication_status' => 'Manuscript in preparation',
            'data_storage_location' => 'Encrypted institutional cloud storage',
        ], $this->userIds['researcher']);
    }

    private function submitApplication(ResearchApplicationService $service, string $department, string $title)
    {
        $applicant = User::where('email', 'researcher@pcc.test')->firstOrFail();
        Auth::onceUsingId($applicant->id);

        return $service->submitForm1([
            'research_title' => $title,
            'researcher_count' => 2,
            'adviser_name' => 'Adam Adviser',
            'department' => $department,
            'level' => 'N/A',
            'course' => 'N/A',
            'section' => 'N/A',
            'respondents' => 'Students',
            'target_respondent_count' => 100,
            'data_collection_method' => 'survey_form',
            'data_capturing_tool' => 'electronic_form',
            'target_start_date' => now()->toDateString(),
            'target_end_date' => now()->addMonths(3)->toDateString(),
            'minors_involved' => false,
            'respondent_head_letter_approved' => true,
            'applicant_type' => 'internal_researcher',
            'purpose' => "Academic research: {$title}",
            'data_types' => ['demographic', 'survey_responses'],
            'data_subjects' => ['students'],
            'retention_plan' => 'Retained for 2 years then securely disposed.',
            'third_party_sharing' => false,
            'study_type' => 'thesis_dissertation',
            'study_design' => 'quantitative',
            'study_sites' => 'Pasig Catholic College',
            'target_population' => 'PCC students',
            'participant_count' => 100,
            'inclusion_criteria' => 'Currently enrolled students.',
            'exclusion_criteria' => 'Students under 18 without guardian consent.',
            'vulnerable_population' => false,
            'risks_to_participants' => 'Minimal, survey fatigue only.',
            'benefits' => 'Contributes to institutional research.',
            'confidentiality_measures' => 'Responses anonymized and password-protected.',
            'consent_process' => 'Informed consent form prior to participation.',
            'data_storage_plan' => 'Encrypted cloud storage, access-controlled.',
        ], $applicant);
    }

    private function endorseThroughToScreening(RemisWorkflowService $remis, $application): void
    {
        $application = $application->fresh();

        Auth::onceUsingId($this->userIds['adviser']);
        $remis->endorse($application, 'adviser', $this->userIds['adviser'], 'approve', 'Endorsed.', 'Adam Adviser');

        Auth::onceUsingId($this->userIds['program_head']);
        $remis->endorse($application->fresh(), 'program_head', $this->userIds['program_head'], 'approve', 'Endorsed.', 'Paula Program Head');

        Auth::onceUsingId($this->userIds['dean']);
        $remis->endorse($application->fresh(), 'dean', $this->userIds['dean'], 'approve', 'Endorsed.', 'Danilo Dean');
    }

    private function seedExtraUsers(): void
    {
        $roleId = fn (string $name) => Role::where('name', $name)->value('id');

        $extras = [
            ['name' => 'Erika External OJT', 'email' => 'ojt.external@pcc.test', 'role' => 'ojt_trainee_external'],
            ['name' => 'Elmer External OJT', 'email' => 'ojt.external2@pcc.test', 'role' => 'ojt_trainee_external'],
            ['name' => 'Sandy Student Teacher', 'email' => 'student.teacher@pcc.test', 'role' => 'ojt_trainee_internal'],
            ['name' => 'Steve Student Teacher', 'email' => 'student.teacher2@pcc.test', 'role' => 'ojt_trainee_external'],
        ];

        foreach ($extras as $extra) {
            User::updateOrCreate(
                ['email' => $extra['email']],
                [
                    'name' => $extra['name'],
                    'password' => 'password',
                    'role_id' => $roleId($extra['role']),
                    'account_status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }

        foreach ([
            'researcher' => 'researcher@pcc.test',
            'dpo_staff' => 'dpo.staff@pcc.test',
            'adviser' => 'adviser@pcc.test',
            'program_head' => 'programhead@pcc.test',
            'dean' => 'dean@pcc.test',
            'secretariat' => 'secretariat@pcc.test',
            'reviewer' => 'reviewer@pcc.test',
            'chair' => 'chair@pcc.test',
            'coordinator' => 'coordinator@pcc.test',
            'trainee@pcc.test' => 'trainee@pcc.test',
            'ojt.external@pcc.test' => 'ojt.external@pcc.test',
            'ojt.external2@pcc.test' => 'ojt.external2@pcc.test',
            'student.teacher@pcc.test' => 'student.teacher@pcc.test',
            'student.teacher2@pcc.test' => 'student.teacher2@pcc.test',
        ] as $key => $email) {
            $this->userIds[$key] = User::where('email', $email)->value('id');
        }
    }
}
