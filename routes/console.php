<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// stakeholder-additional-features.md — retention policy sweep (config/retention.php: 7 years
// issued, 3 years rejected). Runs monthly in REPORT-ONLY mode: it never deletes unless run with
// --purge AND RETENTION_PURGE_ENABLED=true, so the schedule is safe to leave on. Disposal stays a
// deliberate, human-initiated action.
Schedule::command('edms:apply-retention')
    ->monthlyOn(1, '04:00')
    ->description('Report records past their retention window');
