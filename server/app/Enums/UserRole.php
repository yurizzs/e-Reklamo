<?php

namespace App\Enums;

enum UserRole: string
{
    case OPERATOR = 'operator';
    case ADMIN = 'admin';
    case STAFF = 'staff';
    case CITIZEN = 'citizen';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
