<?php

namespace App\Shared\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Shared\Auth\Models\Role;
use App\Shared\Auth\Services\AdminUserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

// docs/4.1-user-roles-permissions.md — the only UI for "Admin can reassign a user's role at
// any time" / "Admin-created (internal/staff) account". Every action is gated by UserPolicy
// (system_administrator only), registered on the User model itself in AppServiceProvider.
class AdminUserController extends Controller
{
    public function __construct(private readonly AdminUserService $users)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        return Inertia::render('Admin/Users/Index', [
            'users' => $this->users->listUsers($request->only(['role_id', 'account_status', 'search'])),
            'roles' => Role::orderBy('side')->orderBy('name')->get(['id', 'name', 'side']),
            'filters' => $request->only(['role_id', 'account_status', 'search']),
            'status' => session('status'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Admin/Users/Create', [
            'roles' => Role::orderBy('side')->orderBy('name')->get(['id', 'name', 'side']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'department' => ['nullable', 'string', 'max:255'],
            'account_status' => ['required', 'in:pending_validation,active,suspended,deactivated'],
        ]);

        $this->users->createUser($data);

        return redirect()->route('admin.users.index')->with('status', 'User created — a password-setup email has been sent.');
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Admin/Users/Edit', [
            'targetUser' => $user->only(['id', 'name', 'email', 'role_id', 'department', 'account_status']),
            'roles' => Role::orderBy('side')->orderBy('name')->get(['id', 'name', 'side']),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'department' => ['nullable', 'string', 'max:255'],
            'account_status' => ['required', 'in:pending_validation,active,suspended,deactivated'],
        ]);

        $this->users->updateUser($user, $data);

        return redirect()->route('admin.users.index')->with('status', 'User updated.');
    }

    // docs/4.1 "Bulk role import for OJT batches" — confirmed required, not prioritized until
    // now. Two-step flow: preview() parses + validates the CSV and stashes the result in the
    // session (so the file itself doesn't need re-uploading); confirmImport() reads that back
    // and actually creates the valid rows. Nothing is persisted until confirmImport().
    public function importForm(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Admin/Users/Import', [
            'roles' => Role::orderBy('side')->orderBy('name')->get(['id', 'name', 'side']),
        ]);
    }

    public function preview(Request $request): Response
    {
        $this->authorize('create', User::class);

        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt']]);

        $rows = $this->users->previewImport($request->file('file'));
        session(['bulk_import_rows' => $rows]);

        return Inertia::render('Admin/Users/Import', [
            'roles' => Role::orderBy('side')->orderBy('name')->get(['id', 'name', 'side']),
            'preview' => $rows,
        ]);
    }

    public function confirmImport(): RedirectResponse
    {
        $this->authorize('create', User::class);

        $rows = session('bulk_import_rows', []);

        if ($rows === []) {
            return redirect()->route('admin.users.import')->withErrors(['file' => 'No preview found — upload a CSV first.']);
        }

        $result = $this->users->importUsers($rows);
        session()->forget('bulk_import_rows');

        $message = "Imported {$result['created']} user".($result['created'] === 1 ? '' : 's').'.';
        if ($result['skipped'] > 0) {
            $message .= " Skipped {$result['skipped']} invalid row".($result['skipped'] === 1 ? '' : 's').'.';
        }

        return redirect()->route('admin.users.index')->with('status', $message);
    }
}
