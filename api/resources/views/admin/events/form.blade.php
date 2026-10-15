@extends('admin.layout')

@section('title', $event->exists ? 'Editar evento' : 'Cadastrar evento')

@section('content')
<h1>{{ $event->exists ? 'Editar evento' : 'Cadastrar evento' }}</h1>
<p class="intro muted">Eventos ativos e ainda não encerrados aparecem no aplicativo.</p>
<section class="panel form-panel">
    <form method="POST" action="{{ $event->exists ? route('admin.events.update', $event->eventoId) : route('admin.events.store') }}">
        @csrf
        @if ($event->exists)@method('PUT')@endif
        <label for="nome">Nome do evento</label>
        <input id="nome" name="nome" value="{{ old('nome', $event->nome) }}" required maxlength="150">
        <label for="descricao">Descrição</label>
        <textarea id="descricao" name="descricao" rows="3" maxlength="255">{{ old('descricao', $event->descricao) }}</textarea>
        <label for="local">Local</label>
        <input id="local" name="local" value="{{ old('local', $event->local) }}" required maxlength="255">
        <label for="categoria">Categoria</label>
        <input id="categoria" name="categoria" value="{{ old('categoria', $event->categoria) }}" required maxlength="100" placeholder="Ex.: Cultura, esporte, música">
        <label for="cidade">Cidade</label>
        <input id="cidade" name="cidade" value="{{ old('cidade', $event->cidade) }}" required maxlength="100">
        <label for="dataInicio">Data e hora de início</label>
        <input id="dataInicio" name="dataInicio" type="datetime-local" value="{{ old('dataInicio', $event->dataInicio?->format('Y-m-d\TH:i')) }}" required>
        <label for="dataFim">Data e hora de encerramento</label>
        <input id="dataFim" name="dataFim" type="datetime-local" value="{{ old('dataFim', $event->dataFim?->format('Y-m-d\TH:i')) }}" required>
        <div class="form-actions">
            <button class="button" type="submit">{{ $event->exists ? 'Salvar evento' : 'Cadastrar evento' }}</button>
            <a class="button secondary" href="{{ route('admin.events') }}">Voltar</a>
        </div>
    </form>
</section>
@endsection
