@extends('admin.layout')

@section('title', 'Contas')

@section('content')
<h1>Contas</h1>
<p class="intro muted">Edite os dados, ative ou desative contas e revise o status dos motoristas.</p>
<form class="filters" method="GET" action="{{ route('admin.accounts.index') }}">
    <input name="q" value="{{ $search }}" placeholder="Buscar por nome, e-mail ou CPF">
    <select name="tipo" aria-label="Filtrar tipo de conta">
        <option value="">Todos os tipos</option>
        <option value="passageiro" @selected($role === 'passageiro')>Passageiros</option>
        <option value="motorista" @selected($role === 'motorista')>Motoristas</option>
    </select>
    <button class="button" type="submit">Filtrar</button>
</form>
<section class="panel table-wrap">
    <table>
        <thead><tr><th>Nome</th><th>Tipo</th><th>E-mail</th><th>Conta</th><th>Status motorista</th><th></th></tr></thead>
        <tbody>
        @forelse ($accounts as $account)
            <tr>
                <td>{{ $account->nome }}</td>
                <td>
                    @if ($account->passageiro)<span class="badge">Passageiro</span>@endif
                    @if ($account->motorista)<span class="badge">Motorista</span>@endif
                </td>
                <td>{{ $account->email }}</td>
                <td><span class="badge {{ $account->statusConta === 'Ativa' ? 'good' : 'bad' }}">{{ $account->statusConta }}</span></td>
                <td>{{ $account->motorista?->statusMotorista ?? '—' }}</td>
                <td><a class="button small secondary" href="{{ route('admin.accounts.edit', $account->userId) }}">Editar</a></td>
            </tr>
        @empty
            <tr><td colspan="6" class="muted">Nenhuma conta encontrada.</td></tr>
        @endforelse
        </tbody>
    </table>
    <div class="pagination">{{ $accounts->links() }}</div>
</section>
@endsection
