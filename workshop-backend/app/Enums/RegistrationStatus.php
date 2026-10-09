<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case Active = 'active';
    case Cancelled = 'cancelled';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
