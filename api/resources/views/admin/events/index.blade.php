@extends('admin.layout')

@section('title', 'Eventos')

@section('content')
<div class="toolbar">
    <div><h1>Eventos</h1><p class="intro muted">Cadastre, edite ou desative eventos exibidos no aplicativo.</p></div>
    <a class="button" href="{{ route('admin.events.create') }}">Cadastrar evento</a>
</div>
<section class="panel table-wrap">
    <table>
        <thead><tr><th>Evento</th><th>Categoria</th><th>Cidade</th><th>Início</th><th>Fim</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
        @forelse ($events as $event)
            <tr>
                <td><strong>{{ $event->nome }}</strong><br><span class="muted">{{ $event->local }}</span></td>
                <td>{{ $event->categoria }}</td>
                <td>{{ $event->cidade }}</td>
                <td>{{ $event->dataInicio->format('d/m/Y H:i') }}</td>
                <td>{{ $event->dataFim->format('d/m/Y H:i') }}</td>
                <td><span class="badge {{ $event->ativo ? 'good' : 'bad' }}">{{ $event->ativo ? 'Ativo' : 'Inativo' }}</span></td>
                <td>
                    <div class="actions">
                        <a class="button small secondary" href="{{ route('admin.events.edit', $event->eventoId) }}">Editar</a>
                        <form method="POST" action="{{ route('admin.events.toggle', $event->eventoId) }}">
                            @csrf
                            @method('PATCH')
                            <button class="button small {{ $event->ativo ? 'danger' : '' }}" type="submit">{{ $event->ativo ? 'Desativar' : 'Ativar' }}</button>
                        </form>
                    </div>
                </td>
            </tr>
        @empty
            <tr><td colspan="7" class="muted">Ainda não há eventos cadastrados.</td></tr>
        @endforelse
        </tbody>
    </table>
    <div class="pagination">{{ $events->links() }}</div>
</section>
@endsection
