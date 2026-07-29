<?php

namespace App\Shared\Onboarding\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Auth\Services\AdminUserService;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Notifications\Services\NotificationService;
use App\Shared\Onboarding\Models\AdviserAccountRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

// Stakeholder 2026-07-28 — external advisers request an account here; the DPO/admin approves it,
// which creates their `adviser` account so they can run their own cohort. Approval/review is
// restricted to system_administrator + dpo_staff.
class AdviserAccountRequestController extends Controller
{
    private const REVIEWER_ROLES = ['system_administrator', 'dpo_staff'];

    public function __construct(
        private readonly AdminUserService $adminUsers,
        private readonly AuditLogService $auditLog,
        private readonly NotificationService $notifications,
    ) {
    }

    // --- Public (guest) request form ---------------------------------------------------------

    public function create(): Response
    {
        return Inertia::render('Auth/RequestAdviserAccount');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                // No existing account, and no request already awaiting review, for this email.
                Rule::unique('users', 'email'),
                Rule::unique('adviser_account_requests', 'email')->where(fn ($q) => $q->where('status', 'pending')),
            ],
            'institution' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'purpose' => ['required', 'string', 'max:2000'],
        ]);

        $adviserRequest = AdviserAccountRequest::create($validated);

        $this->auditLog->record('adviser_account_request.submitted', $adviserRequest, null, [
            'email' => $adviserRequest->email,
        ]);

        // Let the DPO office know a request is waiting.
        $this->notifications->notifyRole(
            'dpo_staff',
            'Adviser account request',
            "{$adviserRequest->name} ({$adviserRequest->email}) has requested an adviser account.",
            $adviserRequest,
        );

        return back()->with('status', 'Your request has been submitted. The Data Privacy Office will review it and email you once an account is ready.');
    }

    // --- Admin/DPO review --------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->authorizeReviewer($request);

        return Inertia::render('Admin/AdviserRequests/Index', [
            'requests' => AdviserAccountRequest::with(['reviewedBy', 'createdUser'])
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'status' => session('status'),
        ]);
    }

    public function approve(Request $request, AdviserAccountRequest $adviserAccountRequest): RedirectResponse
    {
        $this->authorizeReviewer($request);

        if (! $adviserAccountRequest->isPending()) {
            return back()->withErrors(['request' => 'This request has already been reviewed.']);
        }

        // Guard against an account created for this email since the request was filed.
        if (User::where('email', $adviserAccountRequest->email)->exists()) {
            return back()->withErrors(['request' => 'An account already exists for this email address.']);
        }

        $adviserRoleId = Role::where('name', 'adviser')->value('id');

        // Every external onboarder becomes an `adviser`, regardless of their real-world role. The
        // account is created with a random password + verification/reset email (createUser), so the
        // adviser sets their own password and verifies before their first login.
        $user = $this->adminUsers->createUser([
            'name' => $adviserAccountRequest->name,
            'email' => $adviserAccountRequest->email,
            'role_id' => $adviserRoleId,
            'department' => $adviserAccountRequest->department,
            'account_status' => 'active',
        ]);

        $adviserAccountRequest->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'created_user_id' => $user->id,
        ]);

        $this->auditLog->record('adviser_account_request.approved', $adviserAccountRequest, null, [
            'created_user_id' => $user->id,
            'reviewed_by' => $request->user()->id,
        ]);

        return back()->with('status', "Adviser account created for {$user->email}. They have been emailed a link to set their password.");
    }

    public function reject(Request $request, AdviserAccountRequest $adviserAccountRequest): RedirectResponse
    {
        $this->authorizeReviewer($request);

        if (! $adviserAccountRequest->isPending()) {
            return back()->withErrors(['request' => 'This request has already been reviewed.']);
        }

        $validated = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $adviserAccountRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $validated['review_notes'] ?? null,
        ]);

        $this->auditLog->record('adviser_account_request.rejected', $adviserAccountRequest, null, [
            'reviewed_by' => $request->user()->id,
        ]);

        return back()->with('status', 'Request rejected.');
    }

    private function authorizeReviewer(Request $request): void
    {
        abort_unless($request->user()?->hasAnyRole(self::REVIEWER_ROLES), 403);
    }
}
