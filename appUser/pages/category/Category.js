import React, { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

const categories = [
  ['🚗', 'Econômico', 'Economico', 1.0],
  ['🚙', 'Conforto', 'Comfort', 1.4],
  ['🚐', 'SUV', 'SUV', 1.7],
  ['🛵', 'Moto', 'Moto', 0.8],
];

export default function Category({ go, session, setSession }) {
  const [selected, setSelected] = useState(session.tripDraft.categoria || 'Economico');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function requestRide() {
    setLoading(true);
    setError('');
    const draft = { ...session.tripDraft, categoria: selected };
    try {
      const { data } = await api.post('/corridas', draft);
      setSession((current) => ({ ...current, tripDraft: draft, activeRide: data.corrida }));
      go('SearchingDriver');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Escolha a categoria" go={go} back="Beneficiary">
      {categories.map(([icon, title, category, multiplier]) => (
        <Card
          key={category}
          style={selected === category ? { borderWidth: 2, borderColor: '#087a50' } : null}
        >
          <Text onPress={() => setSelected(category)} style={{ fontSize: 17, fontWeight: '700' }}>
            {selected === category ? '● ' : '○ '}{icon} {title}
          </Text>
          <Text style={s.muted}>Valor calculado pela distância e categoria (multiplicador {multiplier}×)</Text>
        </Card>
      ))}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={requestRide} disabled={loading}>
        {loading ? 'Solicitando…' : 'Confirmar e solicitar corrida'}
      </Button>
    </Page>
  );
}
