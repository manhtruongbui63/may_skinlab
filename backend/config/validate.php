<?php

return [

    'max_length' => [
        'name' => 50,
        'email' => 255,
        'password' => 32,
        'phone' => 12,
        'string' => 255,
        'card_number' => 16,
        'note' => 65535,
    ],

    'min_length' => [
        'phone' => 10,
    ],

    'max_value' => [
        'numeric' => 9000000,
        'quantity' => 99,
        'percent' => 100,
    ],

    'min_value' => [
        'quantity' => 1,
        'percent' => 0,
    ],

    'pagination' => [
        'max_per_page' => 100,
    ],

    // Limits for the client-log ingest endpoint (POST /api/logs).
    'log' => [
        'max_batch' => 50,
        'max_message' => 2000,
    ],

];
