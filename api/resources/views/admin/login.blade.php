@extends('admin.layout')

@section('title', 'Acesso administrativo')
@section('login', true)

@section('content')
<main class="login-page">
    <section class="login-card">
        <p class="muted">INTERIORGO · ÁREA RESTRITA</p>
        <h1>Entrar como administrador</h1>
        <p class="muted">Entre com uma conta administrativa ativa de nível Master ou Operador.</p>
        @if (session('status'))<div class="alert">{{ session('status') }}</div>@endif
        @if ($errors->any())<div class="alert errors">{{ $errors->first() }}</div>@endif
        <form method="POST" action="{{ route('admin.login.store') }}">
            @csrf
            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" autocomplete="username" required value="{{ old('email') }}">
            <label for="senha">Senha</label>
            <input id="senha" name="senha" type="password" autocomplete="current-password" required>
            <div style="margin-top:20px"><button class="button" type="submit" style="width:100%">Entrar</button></div>
        </form>
        <p class="muted" style="margin-top:20px">O acesso administrativo é criado por um administrador Master.</p>
    </section>
</main>
@endsection
