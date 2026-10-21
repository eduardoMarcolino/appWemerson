<?php

use App\Rules\ValidCnh;
use App\Rules\ValidCpf;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('checks CPF and CNH check digits and rejects repeated sequences', function () {
    expect(ValidCpf::passes('52998224725'))->toBeTrue()
        ->and(ValidCpf::passes('52998224724'))->toBeFalse()
        ->and(ValidCpf::passes('11111111111'))->toBeFalse()
        ->and(ValidCnh::passes('12345678900'))->toBeTrue()
        ->and(ValidCnh::passes('12345678901'))->toBeFalse()
        ->and(ValidCnh::passes('11000000404'))->toBeTrue()
        ->and(ValidCnh::passes('11000000406'))->toBeFalse()
        ->and(ValidCnh::passes('00000000000'))->toBeFalse();
});

it('rejects invalid CPF and CNH check digits at the API boundary', function () {
    $this->postJson('/api/passageiro/insert', ['cpf' => '52998224724'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cpf');

    $this->postJson('/api/motorista/insert', [
        'cpf' => '52998224725',
        'cnh' => '12345678901',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cnh');
});
