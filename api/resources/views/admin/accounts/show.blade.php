@extends('admin.layout')

@section('title', 'Perfil da conta')

@section('content')
<h1>Perfil da conta</h1>
<p class="intro muted">Dados básicos necessários para a administração. CPF, CNH e senha não são exibidos nesta tela.</p>

<section class="panel form-panel">
    <dl>
        <dt>Nome</dt>
        <dd>{{ $user->nome }}</dd>

        <dt>E-mail</dt>
        <dd>{{ $user->email }}</dd>

        <dt>Telefone</dt>
        <dd>
            @forelse ($user->telefones as $telefone)
                <div>{{ $telefone->numeroTelefone }}</div>
            @empty
                —
            @endforelse
        </dd>

        <dt>Tipo de usuário</dt>
        <dd>
            @if ($user->passageiro)<span class="badge">Passageiro</span>@endif
            @if ($user->motorista)<span class="badge">Motorista</span>@endif
        </dd>

        <dt>Status da conta</dt>
        <dd><span class="badge {{ $user->statusConta === 'Ativa' ? 'good' : 'bad' }}">{{ $user->statusConta }}</span></dd>

        <dt>Data de cadastro</dt>
        <dd>{{ $registeredAt }}</dd>

        @if ($user->motorista)
            <dt>Status de aprovação do motorista</dt>
            <dd>{{ $user->motorista->statusMotorista }}</dd>
        @endif
    </dl>

    <div class="form-actions">
        <a class="button" href="{{ route('admin.accounts.edit', $user->userId) }}">Editar conta</a>
        <a class="button secondary" href="{{ route('admin.accounts.index') }}">Voltar para contas</a>
    </div>
</section>
@endsection
