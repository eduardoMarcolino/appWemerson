import React, { useState } from 'react';
import { ThemedText as Text, Button, Card, Field, s } from '../ui';
import { api } from '../api';

export default function RideCancellation({ rideId, onCancelled }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (reason.trim().length < 3) { setError('Explique o motivo (mínimo de 3 caracteres).'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`/corridas/${rideId}/cancelar`, { motivoCancelamento: reason.trim() });
      onCancelled?.(data.corrida);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  return (
    <>
      {!open ? <Button light onPress={() => setOpen(true)}>Cancelar corrida</Button> : (
        <Card>
          <Text style={s.h2}>Confirmar cancelamento</Text>
          <Text style={s.muted}>O cancelamento não gera cobrança. Após iniciar, a corrida será encerrada para os dois participantes.</Text>
          <Field label="Motivo do cancelamento" placeholder="Descreva brevemente" value={reason} onChangeText={setReason} multiline maxLength={255} />
          {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
          <Button disabled={busy} onPress={cancel}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</Button>
          <Button light disabled={busy} onPress={() => { setOpen(false); setError(''); }}>Voltar</Button>
        </Card>
      )}
    </>
  );
}
