<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCpf implements ValidationRule
{
    public static function passes(mixed $value): bool
    {
        $cpf = preg_replace('/\D/', '', (string) $value);
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        for ($position = 9; $position <= 10; $position++) {
            $sum = 0;
            for ($index = 0; $index < $position; $index++) {
                $sum += (int) $cpf[$index] * (($position + 1) - $index);
            }
            $remainder = ($sum * 10) % 11;
            $digit = $remainder === 10 ? 0 : $remainder;
            if ((int) $cpf[$position] !== $digit) {
                return false;
            }
        }

        return true;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! self::passes($value)) {
            $fail('Informe um CPF com dígitos verificadores válidos.');
        }
    }
}
