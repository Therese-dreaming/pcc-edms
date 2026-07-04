<?php

namespace App\Shared\Auth\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// docs/0.2-stakeholders-and-roles.md — one row per role (16 total: DPO-side + REMIS-side + Admin).
class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'side'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
