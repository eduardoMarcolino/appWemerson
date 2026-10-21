<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCnh implements ValidationRule
{
    public static function passes(mixed $value): bool
    {
        $cnh = preg_replace('/\D/', '', (string) $value);
        if (strlen($cnh) !== 11 || preg_match('/^(\d)\1{10}$/', $cnh)) {
            return false;
        }

        $firstSum = 0;
        $secondSum = 0;
        for ($index = 0; $index < 9; $index++) {
            $digit = (int) $cnh[$index];
            $firstSum += $digit * (9 - $index);
            $secondSum += $digit * ($index + 1);
        }

        $firstDigit = $firstSum % 11;
        $discount = 0;
        if ($firstDigit >= 10) {
            $firstDigit = 0;
            $discount = 2;
        }

        $secondDigit = ($secondSum % 11) - $discount;
        if ($secondDigit < 0) {
            $secondDigit += 11;
        }
        if ($secondDigit >= 10) {
            $secondDigit = 0;
        }

        return (int) $cnh[9] === $firstDigit && (int) $cnh[10] === $secondDigit;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! self::passes($value)) {
            $fail('Informe um número de CNH com dígitos verificadores válidos.');
        }
    }
}
