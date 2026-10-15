@extends('admin.layout')

@section('title', 'Dashboard')

@section('content')
<h1>Dashboard</h1>
<p class="intro muted">Visão geral das contas e da operação da plataforma.</p>
<section class="grid">
    <article class="card"><span class="muted">Passageiros cadastrados</span><div class="metric">{{ number_format($passengerCount) }}</div></article>
    <article class="card"><span class="muted">Motoristas cadastrados</span><div class="metric">{{ number_format($driverCount) }}</div></article>
    <article class="card"><span class="muted">Motoristas pendentes</span><div class="metric">{{ number_format($pendingDriverCount) }}</div>@if ($adminUser->administrador->nivelAcesso === 'Master')<a href="{{ route('admin.accounts.index', ['tipo' => 'motorista']) }}">Revisar contas</a>@endif</article>
    <article class="card"><span class="muted">Eventos ativos</span><div class="metric">{{ number_format($activeEventCount) }}</div></article>
    <article class="card"><span class="muted">Corridas registradas</span><div class="metric">{{ number_format($rideCount) }}</div></article>
</section>
<section class="panel">
    <h2>Ações administrativas</h2>
    <div class="actions">
        @if ($adminUser->administrador->nivelAcesso === 'Master')
            <a class="button" href="{{ route('admin.accounts.index') }}">Gerenciar contas</a>
        @endif
        <a class="button secondary" href="{{ route('admin.events.create') }}">Cadastrar evento</a>
    </div>
</section>
@endsection
