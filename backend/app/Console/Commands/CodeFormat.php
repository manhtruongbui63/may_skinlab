<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class CodeFormat extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'code:format {--check : Only check without fixing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Format project code using Laravel Pint';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        try {
            $command = ['php', 'vendor/bin/pint'];

            if ($this->option('check')) {
                $command[] = '--test';
            }

            $process = new Process($command);
            $process->setTimeout(null);

            $process->run(function ($type, $buffer) {
                $this->line($buffer);
            });

            return $process->getExitCode() ?: 0;
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return 1;
        }
    }
}
