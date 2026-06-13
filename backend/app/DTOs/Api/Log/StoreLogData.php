<?php

namespace App\DTOs\Api\Log;

final readonly class StoreLogData
{
    /**
     * @param array<int, array<string, mixed>> $logs   Validated client log entries.
     * @param array<string, mixed> $meta               Request metadata (ip, user_agent, user_id).
     */
    public function __construct(
        public array $logs,
        public array $meta,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function from(array $data): self
    {
        return new self(
            logs: $data['logs'] ?? [],
            meta: $data['meta'] ?? [],
        );
    }
}
