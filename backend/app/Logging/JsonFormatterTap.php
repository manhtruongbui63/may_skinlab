<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\JsonFormatter;

/**
 * Tap that switches a channel's handlers to newline-delimited JSON output.
 *
 * One JSON object per line is the format Grafana Loki agents (Promtail /
 * Grafana Alloy) ingest with zero brittle regex parsing — the `context` and
 * `extra` fields become queryable structured data. Apply it to a channel via
 * its `tap` array in config/logging.php so the channel is Loki-ready without
 * changing application logging calls.
 */
class JsonFormatterTap
{
    /**
     * Customize the given logger instance.
     */
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(
                new JsonFormatter(JsonFormatter::BATCH_MODE_NEWLINES, true, true, true),
            );
        }
    }
}
