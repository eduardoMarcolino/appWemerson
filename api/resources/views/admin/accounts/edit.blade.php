@extends('admin.layout')

@section('title', 'Editar conta')

@section('content')
<h1>Editar conta</h1>
<p class="intro muted">Atualize os dados de {{ $user->nome }}. Ao desativar a conta, os tokens ativos serão revogados.</p>
<section class="panel form-panel">
    <form method="POST" action="{{ route('admin.accounts.update', $user->userId) }}">
        @csrf
        @method('PUT')
        <label for="nome">Nome completo</label>
        <input id="nome" name="nome" value="{{ old('nome', $user->nome) }}" required maxlength="100">
        <label for="email">E-mail</label>
        <input id="email" name="email" type="email" value="{{ old('email', $user->email) }}" required maxlength="150">
        <label for="cpf">CPF (11 dígitos)</label>
        <input id="cpf" name="cpf" inputmode="numeric" value="{{ old('cpf', $user->cpf) }}" required pattern="[0-9]{11}" maxlength="11">
        <label for="statusConta">Status da conta</label>
        <select id="statusConta" name="statusConta" required>
            @foreach (['Ativa', 'Inativa', 'Bloqueada'] as $status)
                <option value="{{ $status }}" @selected(old('statusConta', $user->statusConta) === $status)>{{ $status }}</option>
            @endforeach
        </select>
        @if ($user->motorista)
            <label for="statusMotorista">Status do motorista</label>
            <select id="statusMotorista" name="statusMotorista" required>
                @foreach (['Pendente', 'Aprovado', 'Bloqueado'] as $status)
                    <option value="{{ $status }}" @selected(old('statusMotorista', $user->motorista->statusMotorista) === $status)>{{ $status }}</option>
                @endforeach
            </select>
        @endif
        <div class="form-actions">
            <button class="button" type="submit">Salvar alterações</button>
            <a class="button secondary" href="{{ route('admin.accounts.index') }}">Voltar</a>
        </div>
    </form>
</section>
@endsection
