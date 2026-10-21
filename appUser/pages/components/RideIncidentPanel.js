import React, { useEffect, useState } from 'react';
import { ThemedText as Text, Button, Card, Field, s } from '../ui';
import { api } from '../api';

const categories = [['Veiculo', 'Problema no veículo'], ['Rota', 'Problema na rota'], ['Emergencia', 'Emergência'], ['Outro', 'Outro']];

export default function RideIncidentPanel({ rideId, enabled }) {
  const [category, setCategory] = useState('Veiculo');
  const [description, setDescription] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || !rideId) return undefined;
    let live = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try { const { data } = await api.getLive(`/corridas/${rideId}/incidentes`); if (live) setIncidents(data.incidentes || []); }
      catch (requestError) { if (live) setError(requestError.message); }
      finally { pending = false; }
    }
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { live = false; clearInterval(timer); };
  }, [enabled, rideId]);

  async function submit() {
    if (description.trim().length < 3) { setError('Descreva o incidente (mínimo de 3 caracteres).'); return; }
    setBusy(true); setError('');
    try { await api.post(`/corridas/${rideId}/incidentes`, { categoria: category, descricao: description.trim() }); setDescription(''); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  if (!enabled) return null;
  return (
    <Card>
      <Text style={s.h2}>Incidentes da corrida</Text>
      <Text style={s.muted}>Registre um problema para que passageiro e motorista possam consultar o histórico.</Text>
      {categories.map(([value, label]) => <Button key={value} light={category !== value} onPress={() => setCategory(value)}>{label}</Button>)}
      <Field label="Descrição" placeholder="O que aconteceu?" value={description} onChangeText={setDescription} multiline maxLength={1000} />
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button disabled={busy} onPress={submit}>{busy ? 'Registrando…' : 'Registrar incidente'}</Button>
      <Text style={{ fontWeight: '700' }}>Histórico</Text>
      {incidents.length ? incidents.map((item) => <Text key={item.incidenteId} style={s.muted}>{item.dataHora} · {item.reportadoPor} · {categories.find(([value]) => value === item.categoria)?.[1] || item.categoria}: {item.descricao || 'Descrição removida'}</Text>) : <Text style={s.muted}>Nenhum incidente registrado.</Text>}
    </Card>
  );
}
