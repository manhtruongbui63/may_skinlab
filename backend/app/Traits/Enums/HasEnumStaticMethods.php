<?php

namespace App\Traits\Enums;

trait HasEnumStaticMethods
{
    /**
     * Get all values of the enum.
     *
     * @return array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get all names of the enum cases.
     *
     * @return array
     */
    public static function names(): array
    {
        return array_column(self::cases(), 'name');
    }

    /**
     * Get all options as an array of ['id' => value, 'name' => label]
     * Suitable for frontend components and MasterData.
     *
     * @return array
     */
    public static function options(): array
    {
        return array_map(fn ($case) => [
            'id' => $case->value,
            'name' => $case->label(),
        ], self::cases());
    }

    /**
     * Get all labels as value => label pairs.
     *
     * @return array
     */
    public static function labels(): array
    {
        $labels = [];
        foreach (self::cases() as $case) {
            $labels[$case->value] = $case->label();
        }
        return $labels;
    }

    /**
     * Get a random enum value.
     * Useful for factories.
     *
     * @return mixed
     */
    public static function random(): mixed
    {
        $cases = self::cases();
        return $cases[array_rand($cases)]->value;
    }

    /**
     * Get enum case from value safely.
     *
     * @param mixed $value
     * @return static|null
     */
    public static function fromValue(mixed $value): ?static
    {
        foreach (self::cases() as $case) {
            if ($case->value === $value) {
                return $case;
            }
        }
        return null;
    }
}
