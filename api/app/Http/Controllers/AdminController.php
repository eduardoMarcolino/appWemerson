<?php

namespace App\Http\Controllers;

use App\Models\admModel;
use App\Models\CorridaModel;
use App\Models\EnderecoModel;
use App\Models\EventoModel;
use App\Models\MotoristaModel;
use App\Models\PassageiroModel;
use App\Models\TelModel;
use App\Models\UserModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\Response;

class AdminController extends Controller
{
    public function dashboard(): View
    {
        return view('admin.dashboard', [
            'passengerCount' => PassageiroModel::count(),
            'driverCount' => MotoristaModel::count(),
            'pendingDriverCount' => MotoristaModel::where('statusMotorista', 'Pendente')->count(),
            'activeEventCount' => EventoModel::where('ativo', true)->count(),
            'rideCount' => CorridaModel::count(),
        ]);
    }

    public function accounts(Request $request): View
    {
        $search = trim((string) $request->query('q', ''));
        $role = $request->query('tipo');

        $accounts = UserModel::query()
            ->with(['passageiro', 'motorista'])
            ->where(function (Builder $query): void {
                $query->whereHas('passageiro')->orWhereHas('motorista');
            })
            ->when($role === 'passageiro', fn (Builder $query) => $query->whereHas('passageiro'))
            ->when($role === 'motorista', fn (Builder $query) => $query->whereHas('motorista'))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('nome', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('cpf', 'like', "%{$search}%");
                });
            })
            ->orderBy('nome')
            ->paginate(15)
            ->withQueryString();

        return view('admin.accounts.index', compact('accounts', 'search', 'role'));
    }

    public function editAccount(int $userId): View
    {
        $user = $this->findCustomerAccount($userId);

        return view('admin.accounts.edit', compact('user'));
    }

    public function updateAccount(Request $request, int $userId): RedirectResponse
    {
        $user = $this->findCustomerAccount($userId);
        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('tbUser', 'email')->ignore($user->userId, 'userId')],
            'cpf' => ['required', 'digits:11', Rule::unique('tbUser', 'cpf')->ignore($user->userId, 'userId')],
            'statusConta' => ['required', Rule::in(['Ativa', 'Inativa', 'Bloqueada'])],
            'statusMotorista' => [
                Rule::requiredIf($user->motorista !== null),
                'nullable',
                Rule::in(['Pendente', 'Aprovado', 'Bloqueado']),
            ],
        ]);

        DB::transaction(function () use ($data, $user): void {
            $user->fill([
                'nome' => $data['nome'],
                'email' => mb_strtolower($data['email']),
                'cpf' => $data['cpf'],
                'statusConta' => $data['statusConta'],
            ])->save();

            if ($user->motorista && isset($data['statusMotorista'])) {
                $user->motorista->update(['statusMotorista' => $data['statusMotorista']]);
            }

            if ($data['statusConta'] !== 'Ativa') {
                $user->tokens()->delete();
            }
        });

        return redirect()->route('admin.accounts.edit', $user->userId)
            ->with('status', 'Conta atualizada com sucesso.');
    }

    public function events(): View
    {
        $events = EventoModel::orderByDesc('dataInicio')->paginate(15);

        return view('admin.events.index', compact('events'));
    }

    public function createEvent(): View
    {
        return view('admin.events.form', ['event' => new EventoModel]);
    }

    public function storeEvent(Request $request): RedirectResponse
    {
        $data = $this->validateEvent($request);
        $data['administradorId'] = $this->currentAdministrator($request)->administradorId;
        EventoModel::create($data);

        return redirect()->route('admin.events')->with('status', 'Evento cadastrado com sucesso.');
    }

    public function editEvent(int $eventId): View
    {
        $event = EventoModel::findOrFail($eventId);

        return view('admin.events.form', compact('event'));
    }

    public function updateEvent(Request $request, int $eventId): RedirectResponse
    {
        $event = EventoModel::findOrFail($eventId);
        $event->update($this->validateEvent($request));

        return redirect()->route('admin.events')->with('status', 'Evento atualizado com sucesso.');
    }

    public function toggleEvent(int $eventId): RedirectResponse
    {
        $event = EventoModel::findOrFail($eventId);
        $event->ativo = ! $event->ativo;
        $event->save();

        return redirect()->route('admin.events')->with('status', 'Status do evento atualizado.');
    }

    private function validateEvent(Request $request): array
    {
        return $request->validate([
            'nome' => ['required', 'string', 'max:150'],
            'descricao' => ['nullable', 'string', 'max:255'],
            'local' => ['required', 'string', 'max:255'],
            'dataInicio' => ['required', 'date'],
            'dataFim' => ['required', 'date', 'after:dataInicio'],
            'categoria' => ['required', 'string', 'max:100'],
            'cidade' => ['required', 'string', 'max:100'],
        ]);
    }

    private function findCustomerAccount(int $userId): UserModel
    {
        $user = UserModel::with(['passageiro', 'motorista'])->findOrFail($userId);
        abort_unless($user->passageiro || $user->motorista, Response::HTTP_NOT_FOUND);

        return $user;
    }

    private function currentAdministrator(Request $request): admModel
    {
        $user = $request->attributes->get('admin_user');
        abort_unless($user instanceof UserModel && $user->administrador instanceof admModel, Response::HTTP_FORBIDDEN);

        return $user->administrador;
    }

    public function cadastro(Request $request)
    {
        $adm = new admModel;
        $user = new UserModel;
        $endereco = new EnderecoModel;
        $telefone = new TelModel;

        try {
            $user->nome = $request->input('nome');
            $user->email = $request->input('email');
            $user->senha = Hash::make($request->input('senha'));
            $user->cpf = $request->input('cpf');
            $user->fotoPerfil = $request->input('fotoPerfil');
            $user->dataCadastro = now();
            $user->statusConta = 'Ativa';

            $user->save();

            $adm->userId = $user->id;
            $adm->nivelAcesso = 'Operador';

            $adm->save();

            $telefone->userId = $user->id;
            $telefone->numeroTelefone = $request->input('numeroTelefone');

            $telefone->save();

            $endereco->userId = $user->id;
            $endereco->logradouro = $request->input('logradouro');
            $endereco->numero = $request->input('numero');
            $endereco->bairro = $request->input('bairro');
            $endereco->cidade = $request->input('cidade');
            $endereco->estado = $request->input('estado');
            $endereco->cep = $request->input('cep');
            $endereco->complemento = $request->input('complemento');

            $endereco->save();

            return response()->json([
                'message' => 'Passageiro cadastrado com sucesso!',
                'passageiro' => $adm,
                'endereco' => $endereco,
                'telefone' => $telefone,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao cadastrar passageiro: '.$e->getMessage(),
            ], 500);
        }
    }
}
