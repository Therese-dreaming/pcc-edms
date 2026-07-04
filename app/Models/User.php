<?php

namespace App\Models;

use App\Shared\Auth\Models\Role;
use App\Shared\ResearchApplications\Models\ResearchApplication;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// docs/4.1-user-roles-permissions.md "Validation Flow": self-registration requires email
// verification before the account can be used. `Illuminate\Foundation\Auth\User` (aliased
// `Authenticatable` above) already includes the `Illuminate\Auth\MustVerifyEmail` trait — the
// only missing piece was this contract interface, which is what Laravel's `verified` middleware
// and the auto-registered `Registered` event listener actually check against.
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'department',
        'account_status',
        'sso_subject_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function researchApplications(): HasMany
    {
        return $this->hasMany(ResearchApplication::class, 'applicant_id');
    }

    public function isActive(): bool
    {
        return $this->account_status === 'active';
    }

    public function hasRole(string $roleName): bool
    {
        return $this->role?->name === $roleName;
    }

    public function hasAnyRole(array $roleNames): bool
    {
        return in_array($this->role?->name, $roleNames, true);
    }
}
