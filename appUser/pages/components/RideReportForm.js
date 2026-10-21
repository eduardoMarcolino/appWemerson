import React, { useState } from 'react';
import { ThemedText as Text, Button, Card, Field, s } from '../ui';
import { api } from '../api';

const reasons = [['Seguranca', 'Segurança'], ['Conduta', 'Conduta'], ['Veiculo', 'Veículo'], ['Rota', 'Rota'], ['Outro', 'Outro']];

export default function RideReportForm({ rideId }) {
  const [reason, setReason] = useState('Conduta');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError('');
    try {
      await api.post(`/corridas/${rideId}/denuncias`, { motivo: reason, descricao: description.trim() || null });
      setSent(true);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  if (!rideId) return null;
  return (
    <Card>
      <Text style={s.h2}>Registrar denúncia</Text>
      <Text style={s.muted}>A denúncia será vinculada a esta corrida e enviada para análise.</Text>
      {sent ? <Text style={{ color: '#087a50' }}>Denúncia registrada.</Text> : (
        <>
          {reasons.map(([value, label]) => <Button key={value} light={reason !== value} onPress={() => setReason(value)}>{label}</Button>)}
          <Field label="Detalhes (opcional)" placeholder="Descreva o ocorrido" value={description} onChangeText={setDescription} multiline maxLength={1000} />
          {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
          <Button disabled={busy} onPress={submit}>{busy ? 'Enviando…' : 'Enviar denúncia'}</Button>
        </>
      )}
    </Card>
  );
}
