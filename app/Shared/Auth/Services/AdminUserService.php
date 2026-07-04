<?php

namespace App\Shared\Auth\Services;

use App\Models\User;
use App\Shared\AuditLog\Services\AuditLogService;
use App\Shared\Auth\Models\Role;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

// docs/4.1-user-roles-permissions.md — Admin-created accounts and role/rights reassignment.
// Self-registration (RegisteredUserController) remains the only path that lets a user pick
// their own password; admin-created accounts get a random one they never see, plus a
// password-reset-link email (reusing the same Breeze flow self-service "forgot password"
// already uses) so the account owner sets their own password on first login.
class AdminUserService
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * @param  array{role_id?: ?int, account_status?: ?string, search?: ?string}  $filters
     */
    public function listUsers(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->with('role')
            ->when($filters['role_id'] ?? null, fn (Builder $q, $roleId) => $q->where('role_id', $roleId))
            ->when($filters['account_status'] ?? null, fn (Builder $q, $status) => $q->where('account_status', $status))
            ->when($filters['search'] ?? null, fn (Builder $q, $search) => $q->where(
                fn (Builder $q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")
            ))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();
    }

    /**
     * @param  array{name: string, email: string, role_id: ?int, department: ?string, account_status: string}  $data
     */
    public function createUser(array $data): User
    {
        $user = User::create([
            ...$data,
            'password' => Str::password(24),
        ]);

        // docs/4.1 Validation Flow step 2 applies to admin-created accounts too, not just
        // self-registration — firing this event queues the same verification email either way.
        event(new Registered($user));

        Password::sendResetLink(['email' => $user->email]);

        $this->auditLog->record('user.created', $user, null, [
            'name' => $user->name,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'account_status' => $user->account_status,
        ]);

        return $user;
    }

    /**
     * Only role/department/account-status/name are editable here — email is left alone since
     * changing it would need to re-trigger verification, which docs/4.1 doesn't describe a flow
     * for. If that's needed later, this is the method to extend, not a new one.
     *
     * @param  array{name?: string, role_id?: ?int, department?: ?string, account_status?: string}  $data
     */
    public function updateUser(User $user, array $data): User
    {
        $before = $user->only(['name', 'role_id', 'department', 'account_status']);

        $user->update($data);

        $after = $user->only(['name', 'role_id', 'department', 'account_status']);
        $changed = array_diff_assoc($after, $before);

        if ($changed !== []) {
            // docs/4.1 "Role changes are logged in the audit trail" — logging every changed
            // field here, not just role_id, since status/department reassignment is the same
            // kind of rights-affecting admin action.
            $this->auditLog->record('user.updated', $user, array_intersect_key($before, $changed), $changed);
        }

        return $user;
    }

    /**
     * Parses and validates a CSV of accounts to create, without persisting anything — the
     * confirmation step (importUsers()) does the actual creation. docs/4.1 "Bulk role import for
     * OJT batches" (confirmed required 2026-07-04, not prioritized until now).
     *
     * Expected header row (case-insensitive): name, email, role, department, account_status.
     * `role` matches a `roles.name` slug (e.g. "ojt_trainee_internal"), not the display label.
     * `department` and `account_status` are optional — account_status defaults to
     * "pending_validation", matching the single-user create form's default.
     *
     * @return list<array{name: string, email: string, role: string, role_id: ?int, department: ?string, account_status: string, valid: bool, errors: list<string>}>
     */
    public function previewImport(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = array_map(fn ($h) => strtolower(trim($h)), fgetcsv($handle) ?: []);
        $roleIdsByName = Role::pluck('id', 'name');
        $existingEmails = User::pluck('email')->map(fn ($e) => strtolower($e))->flip();
        $seenEmails = [];

        $rows = [];

        while (($line = fgetcsv($handle)) !== false) {
            if (count(array_filter($line, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue; // skip blank lines
            }

            $data = array_combine($header, array_pad($line, count($header), null));

            $name = trim((string) ($data['name'] ?? ''));
            $email = strtolower(trim((string) ($data['email'] ?? '')));
            $roleName = trim((string) ($data['role'] ?? ''));
            $department = trim((string) ($data['department'] ?? '')) ?: null;
            $accountStatus = trim((string) ($data['account_status'] ?? '')) ?: 'pending_validation';

            $errors = [];

            if ($name === '') {
                $errors[] = 'Name is required.';
            }

            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Missing or invalid email.';
            } elseif (isset($seenEmails[$email])) {
                $errors[] = 'Duplicate email elsewhere in this file.';
            } elseif ($existingEmails->has($email)) {
                $errors[] = 'An account with this email already exists.';
            }

            $roleId = $roleName !== '' ? $roleIdsByName->get($roleName) : null;
            if ($roleName !== '' && $roleId === null) {
                $errors[] = "Unknown role \"{$roleName}\" — must match a role slug exactly.";
            }

            if (! in_array($accountStatus, ['pending_validation', 'active', 'suspended', 'deactivated'], true)) {
                $errors[] = "Invalid account status \"{$accountStatus}\".";
            }

            if ($errors === []) {
                $seenEmails[$email] = true;
            }

            $rows[] = [
                'name' => $name,
                'email' => $email,
                'role' => $roleName,
                'role_id' => $roleId,
                'department' => $department,
                'account_status' => $accountStatus,
                'valid' => $errors === [],
                'errors' => $errors,
            ];
        }

        fclose($handle);

        return $rows;
    }

    /**
     * Creates one account per valid row via createUser() — same random-password +
     * verification/reset-email path as a single admin-created account, just looped. Invalid rows
     * are silently skipped (the UI shows them as errors before this is ever called).
     *
     * Runs synchronously in the request, same as a single create — fine at OJT-batch scale
     * (tens of rows); if this ever needs to handle hundreds at once, queue it instead of adding
     * a progress bar here.
     *
     * @param  list<array{name: string, email: string, role_id: ?int, department: ?string, account_status: string, valid: bool}>  $rows
     * @return array{created: int, skipped: int}
     */
    public function importUsers(array $rows): array
    {
        $created = 0;

        foreach ($rows as $row) {
            if (! $row['valid']) {
                continue;
            }

            $this->createUser([
                'name' => $row['name'],
                'email' => $row['email'],
                'role_id' => $row['role_id'],
                'department' => $row['department'],
                'account_status' => $row['account_status'],
            ]);

            $created++;
        }

        return ['created' => $created, 'skipped' => count($rows) - $created];
    }
}
