<?php

namespace App\Providers;

use App\Modules\Dpnda\Models\DpndaRecord;
use App\Modules\Dpnda\Models\Placement;
use App\Modules\Dpnda\Models\TraineeSchedule;
use App\Modules\Dpnda\Policies\DpndaRecordPolicy;
use App\Modules\Dpnda\Policies\PlacementPolicy;
use App\Modules\Dpnda\Policies\TraineeSchedulePolicy;
use App\Modules\Dpreq\Models\DpreqApplication;
use App\Modules\Dpreq\Policies\DpreqApplicationPolicy;
use App\Modules\Remis\Incident\Models\Incident;
use App\Modules\Remis\Incident\Policies\IncidentPolicy;
use App\Modules\Remis\Models\RemisApplication;
use App\Modules\Remis\Monitoring\Models\ProgressReport;
use App\Modules\Remis\Monitoring\Policies\ProgressReportPolicy;
use App\Modules\Remis\Policies\RemisApplicationPolicy;
use App\Models\User;
use App\Shared\Auth\Listeners\ActivateUserOnEmailVerification;
use App\Shared\AuditLog\Models\AuditLog;
use App\Shared\AuditLog\Policies\AuditLogPolicy;
use App\Shared\Auth\Policies\UserPolicy;
use App\Shared\Notifications\Models\Notification;
use App\Shared\Notifications\Policies\NotificationPolicy;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Event;
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
        Gate::policy(TraineeSchedule::class, TraineeSchedulePolicy::class);
        Gate::policy(RemisApplication::class, RemisApplicationPolicy::class);
        Gate::policy(Incident::class, IncidentPolicy::class);
        Gate::policy(ProgressReport::class, ProgressReportPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
        Gate::policy(\App\Shared\Onboarding\Models\Cohort::class, \App\Shared\Onboarding\Policies\CohortPolicy::class);

        // docs/4.1-user-roles-permissions.md — email verification is what activates a
        // self-registered account, not a separate manual step.
        Event::listen(Verified::class, ActivateUserOnEmailVerification::class);

        // Branded verification email (resources/views/mail/verify-email.blade.php) instead of
        // Laravel's default plain-markdown notification — carries the PCC EDMS logo + design system.
        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            return (new MailMessage)
                ->subject('Verify your email address — PCC EDMS')
                ->view('mail.verify-email', [
                    'url' => $url,
                    'user' => $notifiable,
                    'logoUrl' => asset('images/logo-small.png'),
                ]);
        });
    }
}
