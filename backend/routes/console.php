<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automated Daily Cloud Backup (Database dump + S3/R2 Cloud Upload + 30-day rotation)
Schedule::command('backup:cloud')->dailyAt('02:00');
Schedule::command('clinic:backup')->dailyAt('03:00');
