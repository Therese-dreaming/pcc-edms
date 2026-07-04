<?php

namespace App\Providers;

use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Dpnda\Policies\DpndaRecordPolicy;
use App\Modules\Dpnda\Policies\PlacementPolicy;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Policies\DpreqApplicationPolicy;
use App\Modules\Remis\Incident\Models\Incident;
use App\Modules\Remis\Incident\Policies\IncidentPolicy;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Modules\Remis\Monitoring\Policies\ProgressReportPolicy;
use App\Modules\Remis\Policies\RemisApplicationPolicy;
use App\Models\User;
use App\Shared\Auth\Policies\UserPolicy;
use App\Shared\Notifications\Models\Notification;
use App\Shared\Notifications\Policies\NotificationPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Modular monolith layout (docs/system-design.md §4) doesn't match Laravel's default
        // app/Models + app/Policies convention, so policies are registered explicitly here
        // rather than relying on auto-discovery.
        Gate::policy(DpreqApplication::class, DpreqApplicationPolicy::class);
        Gate::policy(DpndaRecord::class, DpndaRecordPolicy::class);
        Gate::policy(Placement::class, PlacementPolicy::class);
        Gate::policy(RemisApplication::class, RemisApplicationPolicy::class);
        Gate::policy(Incident::class, IncidentPolicy::class);
        Gate::policy(ProgressReport::class, ProgressReportPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
