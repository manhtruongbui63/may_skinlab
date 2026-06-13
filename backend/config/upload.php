<?php

return [
    'image_types' => [
        'avatar' => [
            'crop' => true,
            'sizes' => [
                'thumb' => ['width' => 100, 'height' => 100],
                '360w' => ['width' => 360, 'height' => 360],
                '720w' => ['width' => 720, 'height' => 720],
            ],
        ],
        'banner' => [
            'crop' => false,
            'sizes' => [
                '360w' => ['width' => 360,  'height' => null],
                '720w' => ['width' => 720,  'height' => null],
                '1080w' => ['width' => 1080, 'height' => null],
            ],
        ],
    ],

    'path_origin_image' => 'originals',

    'path_thumbnail' => 'thumbnails',

    'image_disk' => env('IMAGE_DISK', 'upload'),

    'webp_ext' => 'webp',

    'webp_quality' => env('IMAGE_WEBP_QUALITY', 90),

    'size_max' => env('IMAGE_SIZE_MAX', 5120),

];
