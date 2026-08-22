<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('auth:process-invites')->dailyAt('03:00');
Schedule::command('session:reap-stale-logins')->everyFiveMinutes();
Schedule::command('projects:process-status')->everyFiveMinutes();
Schedule::command('projects:prune-previews')->dailyAt('03:30');
Schedule::command('projects:process-deliveries')->dailyAt('04:00');
Schedule::command('analytics:process')->dailyAt('02:30');
Schedule::command('projects:retention-cleanup')->dailyAt('04:30');
Schedule::command('accounts:purge-trashed')->dailyAt('04:45');
