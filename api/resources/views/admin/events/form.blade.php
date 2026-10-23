@extends('admin.layout')

@section('title', $event->exists ? 'Editar evento' : 'Cadastrar evento')

@section('content')
@php
    $displayDateTime = static function ($value): string {
        if (! $value) return '';
        try {
            return \Illuminate\Support\Carbon::parse($value)->format('d/m/Y H:i');
        } catch (\Throwable) {
            return (string) $value;
        }
    };
@endphp
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
        <input id="dataInicio" name="dataInicio" type="text" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="dd/mm/aaaa hh:mm" data-br-datetime value="{{ $displayDateTime(old('dataInicio', $event->dataInicio)) }}" required>
        <label for="dataFim">Data e hora de encerramento</label>
        <input id="dataFim" name="dataFim" type="text" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="dd/mm/aaaa hh:mm" data-br-datetime value="{{ $displayDateTime(old('dataFim', $event->dataFim)) }}" required>
        <div class="form-actions">
            <button class="button" type="submit">{{ $event->exists ? 'Salvar evento' : 'Cadastrar evento' }}</button>
            <a class="button secondary" href="{{ route('admin.events') }}">Voltar</a>
        </div>
    </form>
</section>
<script>
    document.querySelectorAll('[data-br-datetime]').forEach((input) => {
        input.addEventListener('input', () => {
            const digits = input.value.replace(/\D/g, '').slice(0, 12);
            const day = digits.slice(0, 2);
            const month = digits.slice(2, 4);
            const year = digits.slice(4, 8);
            const hour = digits.slice(8, 10);
            const minute = digits.slice(10, 12);
            let value = day;
            if (digits.length > 2) value += `/${month}`;
            if (digits.length > 4) value += `/${year}`;
            if (digits.length > 8) value += ` ${hour}`;
            if (digits.length > 10) value += `:${minute}`;
            input.value = value;
            input.setSelectionRange(value.length, value.length);
        });
    });
</script>
@endsection
