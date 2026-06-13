<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $imageable_id
 * @property string $imageable_type
 * @property string $url
 * @property string|null $thumb
 * @property string|null $type
 * @property array<string, string>|null $variants
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read array<string, string> $variant_urls
 * @property-read string $responsive_srcset
 */
class Image extends Model
{
    use HasFactory;

    protected $table = 'images';

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'imageable_id',
        'imageable_type',
        'url',
        'thumb',
        'type',
        'variants',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'variants' => 'array',
    ];

    /**
     * Get variants as full URLs object.
     *
     * @return Attribute
     */
    protected function variantUrls(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->variants || !is_array($this->variants)) {
                    return ['original' => Storage::disk(config('upload.image_disk'))->url($this->url)];
                }

                $disk = Storage::disk(config('upload.image_disk'));
                $urls = [];
                foreach ($this->variants as $size => $path) {
                    $urls[$size] = $disk->url($path);
                }

                return $urls;
            },
        );
    }

    /**
     * Get responsive srcset string.
     *
     * @return Attribute
     */
    protected function responsiveSrcset(): Attribute
    {
        return Attribute::make(
            get: function () {
                $urls = $this->variant_urls;
                $srcset = [];
                foreach ($urls as $size => $url) {
                    $width = str_replace('w', '', $size);
                    if (is_numeric($width)) {
                        $srcset[] = "{$url} {$width}w";
                    }
                }

                return implode(', ', $srcset);
            },
        );
    }

    /**
     * Get the parent imageable model (user or post).
     */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}
