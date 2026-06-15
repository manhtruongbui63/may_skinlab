<?php

use App\Jobs\MarkOverdueAppointmentsJob;
use Illuminate\Support\Facades\Schedule;

Schedule::job(MarkOverdueAppointmentsJob::class)
    ->dailyAt('00:01')
    ->withoutOverlapping();
