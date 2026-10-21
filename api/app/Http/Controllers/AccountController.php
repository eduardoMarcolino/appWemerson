<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountUserResource;
use App\Http\Resources\DriverAccountResource;
use App\Http\Resources\UserSummaryResource;
use App\Models\EnderecoModel;
use App\Models\MotoristaModel;
use App\Models\TelModel;
use App\Models\UserModel;
use App\Rules\ValidCpf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class AccountController extends Controller
{
    public function updatePhoto(Request $request): JsonResponse
    {
        $user = $request->user()->load(['passageiro', 'motorista', 'administrador']);
        abort_unless(
            ($user->passageiro || $user->motorista) && ! $user->administrador,
            403,
            'Somente contas de passageiro ou motorista podem alterar a foto de perfil.',
        );

        $data = $request->validate([
            'foto' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $directory = 'profile-photos/'.$user->userId;
        $previousPhoto = $user->fotoPerfil;
        $photoPath = $data['foto']->store($directory, 'public');
        abort_if(! is_string($photoPath), 500, 'Não foi possível salvar a foto de perfil.');

        try {
            DB::transaction(function () use ($user, $photoPath): void {
                $user->fotoPerfil = $photoPath;
                $user->save();
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($photoPath);
            throw $exception;
        }

        if (is_string($previousPhoto) && dirname($previousPhoto) === $directory) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return response()->json([
            'user' => UserSummaryResource::make($user->refresh())->resolve($request),
            'fotoPerfil' => $photoPath,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user()->load(['passageiro', 'motorista']);
        abort_unless(
            $user->passageiro || $user->motorista,
            403,
            'Somente contas de passageiro ou motorista podem ser alteradas por este endpoint.',
        );

        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('tbUser', 'email')->ignore($user->userId, 'userId')],
            'cpf' => ['required', 'digits:11', new ValidCpf, Rule::unique('tbUser', 'cpf')->ignore($user->userId, 'userId')],
            'numeroTelefone' => ['required', 'string', 'max:20'],
            'logradouro' => ['required', 'string', 'max:150'],
            'numero' => ['nullable', 'string', 'max:10'],
            'complemento' => ['nullable', 'string', 'max:100'],
            'bairro' => ['nullable', 'string', 'max:100'],
            'cidade' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'digits:8'],
            'senhaAtual' => ['required', 'string', 'max:255'],
            'novaSenha' => ['nullable', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        $this->assertCurrentPassword($user, $data['senhaAtual']);

        DB::transaction(function () use ($data, $user): void {
            $user->fill([
                'nome' => $data['nome'],
                'email' => mb_strtolower(trim($data['email'])),
                'cpf' => $data['cpf'],
            ]);
            if (! empty($data['novaSenha'])) {
                $user->senha = Hash::make($data['novaSenha']);
            }
            $user->save();

            TelModel::updateOrCreate(
                ['userId' => $user->userId],
                ['numeroTelefone' => $data['numeroTelefone']],
            );
            EnderecoModel::updateOrCreate(
                ['userId' => $user->userId],
                [
                    'logradouro' => $data['logradouro'],
                    'numero' => $data['numero'] ?? null,
                    'complemento' => $data['complemento'] ?? null,
                    'bairro' => $data['bairro'] ?? null,
                    'cidade' => $data['cidade'] ?? null,
                    'estado' => $data['estado'] ?? null,
                    'cep' => $data['cep'] ?? null,
                ],
            );

            if (! empty($data['novaSenha'])) {
                $user->tokens()->where('id', '!=', $user->currentAccessToken()?->getKey())->delete();
            }
        });

        $user->refresh()->load(['passageiro', 'motorista', 'telefones', 'enderecos']);

        return response()->json([
            'user' => AccountUserResource::make($user)->resolve($request),
            'passageiro' => $user->passageiro ? [
                'passageiroId' => $user->passageiro->passageiroId,
                'status' => $user->passageiro->status,
            ] : null,
            'motorista' => $user->motorista
                ? DriverAccountResource::make(MotoristaModel::with('veiculos')->find($user->motorista->motoristaId))->resolve($request)
                : null,
            'telefones' => $user->telefones->map(fn ($phone): array => [
                'numeroTelefone' => $phone->numeroTelefone,
            ])->all(),
            'enderecos' => $user->enderecos->map(fn ($address): array => [
                'logradouro' => $address->logradouro,
                'numero' => $address->numero,
                'complemento' => $address->complemento,
                'bairro' => $address->bairro,
                'cidade' => $address->cidade,
                'estado' => $address->estado,
                'cep' => $address->cep,
            ])->all(),
        ]);
    }

    public function deactivate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'senhaAtual' => ['required', 'string', 'max:255'],
        ]);
        $user = $request->user()->load(['passageiro', 'motorista', 'administrador']);
        abort_unless(($user->passageiro || $user->motorista) && ! $user->administrador, 403);
        $this->assertCurrentPassword($user, $data['senhaAtual']);
        $userId = $user->userId;
        $photoDirectory = 'profile-photos/'.$userId;
        $oldEmail = $user->email;

        DB::transaction(function () use ($user, $userId, $oldEmail): void {
            $user = UserModel::query()->where('userId', $userId)->lockForUpdate()->firstOrFail();
            $passengerId = $user->passageiro?->passageiroId;
            $driverId = $user->motorista?->motoristaId;
            $activeStatuses = ['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento'];
            $activeRide = DB::table('tbCorrida')->whereIn('status', $activeStatuses)
                ->where(function ($query) use ($passengerId, $driverId): void {
                    if ($passengerId) $query->orWhere('passageiroId', $passengerId);
                    if ($driverId) $query->orWhere('motoristaId', $driverId);
                })->exists();
            $activeScheduledRide = DB::table('tbCorridaAgendada')->where('status', 'EmAndamento')
                ->where(function ($query) use ($passengerId, $driverId): void {
                    if ($passengerId) $query->orWhere('passageiroId', $passengerId);
                    if ($driverId) $query->orWhere('motoristaId', $driverId);
                })->exists();
            abort_if($activeRide || $activeScheduledRide, 409, 'Finalize ou cancele suas corridas em andamento antes de excluir a conta.');

            $rideIds = DB::table('tbCorrida')->where(function ($query) use ($passengerId, $driverId): void {
                if ($passengerId) $query->orWhere('passageiroId', $passengerId);
                if ($driverId) $query->orWhere('motoristaId', $driverId);
            })->pluck('corridaId');

            if ($rideIds->isNotEmpty()) {
                DB::table('tbLocalizacao')->whereIn('corridaId', $rideIds)->delete();
                if (DB::getSchemaBuilder()->hasTable('tbCorridaPosicao')) {
                    DB::table('tbCorridaPosicao')->whereIn('corridaId', $rideIds)->delete();
                }
                DB::table('tbCorrida')->whereIn('corridaId', $rideIds)->update([
                    'origem' => 'Dados removidos', 'destino' => 'Dados removidos',
                    'latitudeOrigem' => 0, 'longitudeOrigem' => 0,
                    'latitudeDestino' => 0, 'longitudeDestino' => 0,
                    'beneficiarioNome' => null, 'beneficiarioTelefone' => null,
                    'tokenCompartilhamento' => null, 'motivoCancelamento' => null,
                    'pontoEncontroId' => null, 'enderecoFavoritoId' => null,
                ]);
                DB::table('tbAvaliacao')->whereIn('corridaId', $rideIds)->where(function ($query) use ($passengerId, $driverId): void {
                    if ($passengerId) $query->orWhere('passageiroId', $passengerId);
                    if ($driverId) $query->orWhere('motoristaId', $driverId);
                })->update(['comentario' => null]);
                if (DB::getSchemaBuilder()->hasTable('tbIncidenteCorrida')) {
                    DB::table('tbIncidenteCorrida')->whereIn('corridaId', $rideIds)->update(['descricao' => null]);
                }
                if (DB::getSchemaBuilder()->hasTable('tbDenunciaCorrida')) {
                    DB::table('tbDenunciaCorrida')->whereIn('corridaId', $rideIds)->update(['descricao' => null]);
                }
            }
            if ($driverId) {
                DB::table('tbLocalizacao')->where('motoristaId', $driverId)->delete();
            }

            if ($passengerId) {
                DB::table('tbCorridaAgendada')->where('passageiroId', $passengerId)->update([
                    'origem' => 'Dados removidos', 'destino' => 'Dados removidos',
                    'status' => 'Cancelada', 'motoristaId' => null, 'pontoEncontroId' => null,
                ]);
                DB::table('tbFavoritoMotorista')->where('passageiroId', $passengerId)->delete();
                DB::table('tbPassageiro')->where('passageiroId', $passengerId)->update(['status' => 'Inativo']);
            }
            if ($driverId) {
                DB::table('tbCorridaAgendada')->where('motoristaId', $driverId)->update([
                    'status' => 'Cancelada', 'motoristaId' => null, 'pontoEncontroId' => null,
                    'origem' => 'Dados removidos', 'destino' => 'Dados removidos',
                ]);
                DB::table('tbFavoritoMotorista')->where('motoristaId', $driverId)->delete();
                DB::table('tbVeiculo')->where('motoristaId', $driverId)->delete();
                DB::table('tbMotorista')->where('motoristaId', $driverId)->update([
                    'cnh' => 'REMOVIDA', 'validadeCNH' => '1900-01-01', 'statusMotorista' => 'Bloqueado',
                ]);
            }

            $user->nome = 'Conta removida';
            $user->email = 'removida-'.$userId.'@interiorgo.invalid';
            $user->cpf = $this->unusedSyntheticCpf($userId);
            $user->senha = Hash::make(Str::random(64));
            $user->fotoPerfil = null;
            $user->statusConta = 'Inativa';
            $user->save();

            DB::table('tbTelefone')->where('userId', $userId)->delete();
            DB::table('tbEndereco')->where('userId', $userId)->delete();
            DB::table('tbEnderecoFavorito')->where('userId', $userId)->delete();
            if ($passengerId) {
                DB::table('tbPontoEncontro')->where('passageiroId', $passengerId)->delete();
            }
            $user->tokens()->delete();
            if (DB::getSchemaBuilder()->hasTable('tbExpoPushToken')) {
                DB::table('tbExpoPushToken')->where('userId', $userId)->delete();
            }
            if (DB::getSchemaBuilder()->hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $userId)->delete();
            }
            $resetTable = config('auth.passwords.users.table', 'password_reset_tokens');
            if (DB::getSchemaBuilder()->hasTable($resetTable)) {
                DB::table($resetTable)->where('email', $oldEmail)->delete();
            }
        });

        Storage::disk('public')->deleteDirectory($photoDirectory);
        Log::info('Conta excluída e dados pessoais removidos ou pseudonimizados; histórico operacional preservado.');

        return response()->json([
            'message' => 'Conta excluída. Dados pessoais foram removidos ou pseudonimizados; alguns dados operacionais das corridas foram preservados.',
        ]);
    }

    private function unusedSyntheticCpf(int $userId): string
    {
        $candidate = str_pad((string) $userId, 11, '0', STR_PAD_LEFT);
        while (DB::table('tbUser')->where('cpf', $candidate)->exists() || ValidCpf::passes($candidate)) {
            $candidate = str_pad((string) (((int) $candidate + 1) % 100000000000), 11, '0', STR_PAD_LEFT);
        }
        return $candidate;
    }

    private function assertCurrentPassword(UserModel $user, string $password): void
    {
        if (! Hash::check($password, $user->senha)) {
            throw ValidationException::withMessages([
                'senhaAtual' => 'A senha atual está incorreta.',
            ]);
        }
    }
}
