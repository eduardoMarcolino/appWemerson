@extends('admin.layout')

@section('title', 'Cadastro de Operador')
@section('login', true)

@section('content')
<main class="login-page">
    <section class="login-card">
        <p class="muted">INTERIORGO · CADASTRO ADMINISTRATIVO</p>
        <h1>Criar conta de Operador</h1>
        <p class="muted">O cadastro público cria apenas contas Operador. O acesso Master é concedido separadamente.</p>
        @if ($errors->any())<div class="alert errors">{{ $errors->first() }}</div>@endif
        <form method="POST" action="{{ route('admin.register.store') }}">
            @csrf
            <label for="nome">Nome completo</label>
            <input id="nome" name="nome" autocomplete="name" required maxlength="100" value="{{ old('nome') }}">
            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" autocomplete="email" required maxlength="150" value="{{ old('email') }}">
            <label for="cpf">CPF (11 dígitos)</label>
            <input id="cpf" name="cpf" inputmode="numeric" required pattern="[0-9]{11}" maxlength="11" value="{{ old('cpf') }}">
            <label for="senha">Senha (mínimo 8 caracteres)</label>
            <input id="senha" name="senha" type="password" autocomplete="new-password" required minlength="8">
            <label for="senha_confirmation">Confirmar senha</label>
            <input id="senha_confirmation" name="senha_confirmation" type="password" autocomplete="new-password" required minlength="8">
            <div style="margin-top:20px"><button class="button" type="submit" style="width:100%">Criar conta Operador</button></div>
        </form>
        <p class="muted" style="margin-top:20px"><a href="{{ route('admin.login') }}">Voltar para o login</a></p>
    </section>
</main>
@endsection
