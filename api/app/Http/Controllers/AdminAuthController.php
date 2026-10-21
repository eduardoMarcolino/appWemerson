<?php

namespace App\Http\Controllers;

use App\Models\admModel;
use App\Models\UserModel;
use App\Rules\ValidCpf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class AdminAuthController extends Controller
{
    public function create(Request $request): RedirectResponse|View
    {
        if ($request->session()->has('admin_user_id')) {
            return redirect()->route('admin.dashboard');
        }

        return view('admin.login');
    }

    public function createRegistration(): View
    {
        return view('admin.register');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:tbUser,email'],
            'cpf' => ['required', 'digits:11', new ValidCpf, 'unique:tbUser,cpf'],
            'senha' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        DB::transaction(function () use ($data): void {
            $user = UserModel::create([
                'nome' => $data['nome'],
                'email' => mb_strtolower(trim($data['email'])),
                'senha' => Hash::make($data['senha']),
                'cpf' => $data['cpf'],
                'dataCadastro' => now(),
                'statusConta' => 'Ativa',
            ]);

            admModel::create([
                'userId' => $user->userId,
                'nivelAcesso' => 'Operador',
            ]);
        });

        return redirect()->route('admin.login')
            ->with('status', 'Conta de Operador criada. Entre para acessar o painel.');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:150'],
            'senha' => ['required', 'string', 'max:255'],
        ]);

        $user = UserModel::with('administrador')
            ->where('email', mb_strtolower(trim($credentials['email'])))
            ->first();

        if (! $user
            || $user->statusConta !== 'Ativa'
            || ! in_array($user->administrador?->nivelAcesso, ['Master', 'Operador'], true)
            || ! Hash::check($credentials['senha'], $user->senha)) {
            return back()
                ->withErrors(['email' => 'E-mail ou senha inválidos para uma conta administrativa ativa.'])
                ->onlyInput('email');
        }

        $request->session()->regenerate();
        $request->session()->put('admin_user_id', $user->userId);

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget('admin_user_id');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
