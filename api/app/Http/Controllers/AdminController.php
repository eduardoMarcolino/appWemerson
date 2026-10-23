<?php

namespace App\Http\Controllers;

use App\Models\admModel;
use App\Models\CorridaModel;
use App\Models\EventoModel;
use App\Models\MotoristaModel;
use App\Models\PassageiroModel;
use App\Models\UserModel;
use App\Rules\ValidCnh;
use App\Rules\ValidCpf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
        $role = in_array($request->query('tipo'), ['passageiro', 'motorista'], true)
            ? $request->query('tipo')
            : '';
        $status = in_array($request->query('status'), ['Ativa', 'Inativa', 'Bloqueada'], true)
            ? $request->query('status')
            : '';

        $accounts = UserModel::query()
            ->with(['passageiro', 'motorista'])
            ->where(function (Builder $query): void {
                $query->whereHas('passageiro')->orWhereHas('motorista');
            })
            ->when($role === 'passageiro', fn (Builder $query) => $query->whereHas('passageiro'))
            ->when($role === 'motorista', fn (Builder $query) => $query->whereHas('motorista'))
            ->when($status !== '', fn (Builder $query) => $query->where('statusConta', $status))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('nome', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('nome')
            ->paginate(15)
            ->withQueryString();

        return view('admin.accounts.index', compact('accounts', 'search', 'role', 'status'));
    }

    public function showAccount(Request $request, int $userId): View
    {
        $user = UserModel::with(['passageiro', 'motorista', 'telefones'])->findOrFail($userId);
        abort_unless($user->passageiro || $user->motorista, Response::HTTP_NOT_FOUND);

        $administrator = $request->attributes->get('admin_user');
        Log::info('admin.account.profile_viewed', [
            'administrator_user_id' => $administrator?->userId,
            'viewed_user_id' => $user->userId,
            'viewed_at' => now()->toIso8601String(),
        ]);

        $registeredAt = $user->dataCadastro
            ? Carbon::parse($user->dataCadastro)->format('d/m/Y H:i')
            : '—';

        return view('admin.accounts.show', compact('user', 'registeredAt'));
    }

    public function editAccount(int $userId): View
    {
        $user = UserModel::with(['passageiro', 'motorista.veiculos'])->findOrFail($userId);
        abort_unless($user->passageiro || $user->motorista, Response::HTTP_NOT_FOUND);

        $maskedCpf = $this->maskDocument($user->cpf);
        $maskedCnh = $user->motorista ? $this->maskDocument($user->motorista->cnh) : null;

        return view('admin.accounts.edit', compact('user', 'maskedCpf', 'maskedCnh'));
    }

    public function updateAccount(Request $request, int $userId): RedirectResponse
    {
        $user = $this->findCustomerAccount($userId);
        if (
            $user->motorista
            && $request->input('statusMotorista') === 'Aprovado'
            && $user->motorista->validadeCNH < now()->toDateString()
        ) {
            throw ValidationException::withMessages([
                'statusMotorista' => 'Não é possível aprovar um motorista com a CNH vencida.',
            ]);
        }
        if (
            $user->motorista
            && $request->input('statusMotorista') === 'Aprovado'
            && ! ValidCnh::passes($user->motorista->cnh)
        ) {
            throw ValidationException::withMessages([
                'statusMotorista' => 'Não é possível aprovar um motorista com número de CNH inválido.',
            ]);
        }

        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('tbUser', 'email')->ignore($user->userId, 'userId')],
            'cpf' => ['sometimes', 'required', 'digits:11', new ValidCpf, Rule::unique('tbUser', 'cpf')->ignore($user->userId, 'userId')],
            'statusConta' => ['required', Rule::in(['Ativa', 'Inativa', 'Bloqueada'])],
            'statusMotorista' => [
                Rule::requiredIf($user->motorista !== null),
                'nullable',
                Rule::in(['Pendente', 'Aprovado', 'Bloqueado']),
            ],
            'confirmacaoDocumentos' => [
                Rule::requiredIf(
                    $user->motorista !== null
                    && $user->motorista->statusMotorista !== 'Aprovado'
                    && $request->input('statusMotorista') === 'Aprovado'
                ),
                'accepted',
            ],
        ]);

        DB::transaction(function () use ($data, $user): void {
            $attributes = [
                'nome' => $data['nome'],
                'email' => mb_strtolower($data['email']),
                'statusConta' => $data['statusConta'],
            ];
            if (array_key_exists('cpf', $data)) {
                $attributes['cpf'] = $data['cpf'];
            }
            $user->fill($attributes)->save();

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
        foreach (['dataInicio', 'dataFim'] as $field) {
            $value = trim((string) $request->input($field, ''));
            foreach ([
                ['!d/m/Y H:i', 'd/m/Y H:i'],
                ['!Y-m-d\\TH:i', 'Y-m-d\\TH:i'],
                ['!Y-m-d H:i:s', 'Y-m-d H:i:s'],
                ['!Y-m-d\\TH:i:s', 'Y-m-d\\TH:i:s'],
            ] as [$inputFormat, $roundTripFormat]) {
                try {
                    $date = Carbon::createFromFormat($inputFormat, $value);
                    if ($date && $date->format($roundTripFormat) === $value) {
                        $request->merge([$field => $date->format('Y-m-d H:i:s')]);
                        break;
                    }
                } catch (\Throwable) {
                    // Tenta o próximo formato aceito; a validação abaixo trata o valor inválido.
                }
            }
        }

        return $request->validate([
            'nome' => ['required', 'string', 'max:150'],
            'descricao' => ['nullable', 'string', 'max:255'],
            'local' => ['required', 'string', 'max:255'],
            'dataInicio' => ['required', 'date_format:Y-m-d H:i:s'],
            'dataFim' => ['required', 'date_format:Y-m-d H:i:s', 'after:dataInicio'],
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

    private function maskDocument(?string $document): string
    {
        $digits = preg_replace('/\D/', '', (string) $document);
        if ($digits === '') {
            return 'Não informado';
        }

        return str_repeat('•', max(0, strlen($digits) - 2)).substr($digits, -2);
    }
}
