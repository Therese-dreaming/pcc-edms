import DetailTable from './DetailTable';
import {
    PANEL,
    PANEL_HEAD,
    PANEL_TITLE,
    PANEL_EYEBROW,
    titleCase,
    formatDate,
    yesNo,
    asList,
} from './primitives';

// Small presentational wrapper so each detail panel shares the same header treatment.
function Section({ eyebrow, title, rows }) {
    return (
        <div className={PANEL}>
            <div className={PANEL_HEAD}>
                <div>
                    <p className={PANEL_EYEBROW}>{eyebrow}</p>
                    <h3 className={PANEL_TITLE}>{title}</h3>
                </div>
            </div>
            <DetailTable rows={rows} />
        </div>
    );
}

// The three read-only detail sections of the application: Section A (applicant),
// Section B (study), and the DPO review fields. All derive their rows from the shared
// research application + the DPREQ record, preserving the original field set exactly —
// including the employee-vs-student split (stakeholder 2026-07-28).
export default function SectionPanels({ application, research }) {
    const isEmployeeApplicant = (research.applicant_category ?? 'student') === 'employee';

    const applicantRows = [
        { label: 'Applicant', value: application.applicant?.name },
        { label: 'Applicant Type', value: titleCase(application.applicant_type) },
        { label: 'Filing As', value: titleCase(research.applicant_category) ?? 'Student' },
        { label: 'Adviser', value: research.adviser_name },
        { label: 'Researchers', value: research.researcher_count },
        {
            label: isEmployeeApplicant ? 'Department / Office' : 'Department',
            value: research.department ?? application.department,
        },
        // Employees give a Position; students give Level/Course/Section (stakeholder 2026-07-28).
        ...(isEmployeeApplicant
            ? [{ label: 'Position', value: research.position }]
            : [
                { label: 'Level', value: research.level },
                { label: 'Course', value: research.course },
                { label: 'Section', value: research.section },
            ]),
    ];

    const studyRows = [
        { label: 'Respondents', value: research.respondents },
        { label: 'Target Respondents', value: research.target_respondent_count },
        { label: 'Collection Method', value: titleCase(research.data_collection_method) },
        { label: 'Capturing Tool', value: titleCase(research.data_capturing_tool) },
        { label: 'Duration Start', value: formatDate(research.target_start_date) },
        { label: 'Duration End', value: formatDate(research.target_end_date) },
        { label: 'Minors Involved', value: yesNo(research.minors_involved) },
        { label: 'Head Letter Approved', value: yesNo(research.respondent_head_letter_approved) },
    ];

    const dpoRows = [
        { label: 'Purpose', value: application.purpose },
        { label: 'Personal Data Types', value: asList(application.data_types) },
        { label: 'Data Subjects', value: asList(application.data_subjects) },
        { label: 'Retention Plan', value: application.retention_plan },
        { label: '3rd-Party Sharing', value: yesNo(application.third_party_sharing) },
        ...(application.third_party_sharing
            ? [{ label: '3rd-Party Detail', value: application.third_party_detail }]
            : []),
    ];

    return (
        <>
            <Section eyebrow="Section A" title="Applicant Information" rows={applicantRows} />
            <Section eyebrow="Section B" title="Study Information" rows={studyRows} />
            <Section eyebrow="Privacy" title="DPO Review Information" rows={dpoRows} />
        </>
    );
}
