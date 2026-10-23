import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';

import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function Category({ go, session, setSession }) {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(session.tripDraft.categoria || '');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/catalogos')
      .then(({ data }) => {
        setCategories(data.categorias);
        setSelected((current) => current || data.categorias[0]?.value || '');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCatalogLoading(false));
  }, []);

  async function requestRide() {
    setLoading(true);
    setError('');
    const draft = { ...session.tripDraft, categoria: selected };
    try {
      const { data } = await api.post('/corridas', draft);
      setSession((current) => ({ ...current, tripDraft: draft, activeRide: data.corrida }));
      go('SearchingDriver');
    } catch (requestError) {
      if (requestError.status === 409) {
        try {
          const { data } = await api.getLive('/corridas/ativa');
          if (data.activeRide) {
            setSession((current) => ({ ...current, tripDraft: draft, activeRide: data.activeRide }));
            go('SearchingDriver');
            return;
          }
        } catch (_lookupError) {
          // Mantém a mensagem original se não for possível recuperar a corrida ativa.
        }
      }
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Escolha a categoria" go={go} back="Beneficiary">
      {catalogLoading ? <Text style={s.muted}>Carregando categorias…</Text> : null}
      {categories.map(({ icon, label, value }) => (
        <Card
          key={value}
          style={selected === value ? { borderWidth: 2, borderColor: '#087a50' } : null}
        >
          <Text onPress={() => setSelected(value)} style={{ fontSize: 17, fontWeight: '700' }}>
            {selected === value ? '● ' : '○ '}{icon} {label}
          </Text>
          <Text style={s.muted}>O valor da corrida será calculado pela API antes da confirmação.</Text>
        </Card>
      ))}
      {!catalogLoading && categories.length === 0 && !error
        ? <Text style={s.muted}>Nenhuma categoria está disponível.</Text>
        : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={requestRide} disabled={loading || catalogLoading || !selected}>
        {loading ? 'Solicitando…' : 'Confirmar e solicitar corrida'}
      </Button>
    </Page>
  );
}
