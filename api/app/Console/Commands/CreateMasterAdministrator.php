<?php

namespace App\Console\Commands;

use App\Models\admModel;
use App\Models\UserModel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateMasterAdministrator extends Command
{
    protected $signature = 'admin:create-master';

    protected $description = 'Create the first Master administrator account';

    public function handle(): int
    {
        if (admModel::where('nivelAcesso', 'Master')->exists()) {
            $this->components->error('Já existe um administrador Master. O primeiro acesso não será recriado.');

            return self::FAILURE;
        }

        $name = trim($this->ask('Nome completo'));
        $email = mb_strtolower(trim($this->ask('E-mail')));
        $cpf = preg_replace('/\D/', '', $this->ask('CPF (11 dígitos)'));
        $password = $this->secret('Senha (mínimo 12 caracteres)');

        $validator = Validator::make(
            ['nome' => $name, 'email' => $email, 'cpf' => $cpf, 'senha' => $password],
            [
                'nome' => ['required', 'string', 'min:3', 'max:100'],
                'email' => ['required', 'email', 'max:150', 'unique:tbUser,email'],
                'cpf' => ['required', 'digits:11', 'unique:tbUser,cpf'],
                'senha' => ['required', 'string', 'min:12', 'max:255'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return self::FAILURE;
        }

        DB::transaction(function () use ($name, $email, $cpf, $password): void {
            $user = UserModel::create([
                'nome' => $name,
                'email' => $email,
                'senha' => Hash::make($password),
                'cpf' => $cpf,
                'dataCadastro' => now(),
                'statusConta' => 'Ativa',
            ]);

            admModel::create([
                'userId' => $user->userId,
                'nivelAcesso' => 'Master',
            ]);
        });

        $this->components->info('Administrador Master criado com sucesso.');

        return self::SUCCESS;
    }
}
