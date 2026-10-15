<?php

namespace App\Support;

final class RideCatalog
{
    public static function categories(): array
    {
        return [
            ['value' => 'Economico', 'label' => 'Econômico', 'icon' => '🚗'],
            ['value' => 'Comfort', 'label' => 'Conforto', 'icon' => '🚙'],
            ['value' => 'SUV', 'label' => 'SUV', 'icon' => '🚐'],
            ['value' => 'Moto', 'label' => 'Moto', 'icon' => '🛵'],
        ];
    }

    public static function categoryValues(): array
    {
        return array_column(self::categories(), 'value');
    }

    public static function fareMultipliers(): array
    {
        return ['Economico' => 1.0, 'Comfort' => 1.4, 'SUV' => 1.7, 'Moto' => 0.8];
    }

    public static function paymentMethods(): array
    {
        return [
            ['value' => 'Pix', 'label' => 'Pix'],
            ['value' => 'Dinheiro', 'label' => 'Dinheiro'],
            ['value' => 'CartaoCredito', 'label' => 'Cartão de crédito (simulado)'],
            ['value' => 'CartaoDebito', 'label' => 'Cartão de débito (simulado)'],
            ['value' => 'CarteiraDigital', 'label' => 'Carteira digital (simulada)'],
        ];
    }

    public static function paymentMethodValues(): array
    {
        return array_column(self::paymentMethods(), 'value');
    }
}
