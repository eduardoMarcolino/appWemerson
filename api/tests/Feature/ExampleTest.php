<?php

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Route;

test('the application returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

test('API database errors do not expose SQL details to clients', function () {
    Route::get('/api/testing/database-error', function () {
        throw new QueryException(
            'mysql',
            'select * from private_table',
            [],
            new PDOException('SQLSTATE[42S02]: Base table or view not found'),
        );
    });

    $this->getJson('/api/testing/database-error')
        ->assertInternalServerError()
        ->assertExactJson([
            'message' => 'Ocorreu um erro no servidor. Tente novamente mais tarde.',
        ])
        ->assertDontSee('SQLSTATE')
        ->assertDontSee('private_table');
});
