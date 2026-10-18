import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function Payment({ go, session, setSession }) {
  const [methods, setMethods] = useState([]);
  const [method, setMethod] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const rideId = session.activeRide?.corrida?.corridaId;
  const amount = Number(session.activeRide?.corrida?.valorCorrida || 0);

  useEffect(() => {
    api.get('/catalogos')
      .then(({ data }) => {
        setMethods(data.formasPagamento);
        setMethod((current) => current || data.formasPagamento[0]?.value || '');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCatalogLoading(false));
  }, []);

  async function confirmPayment() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/corridas/${rideId}/pagamento`, { formaPagamento: method });
      setSession((current) => ({
        ...current,
        activeRide: { ...current.activeRide, pagamento: data.pagamento },
      }));
      go('RateDriver');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Pagamento" go={go} back="SearchingDriver">
      <Text style={s.muted}>Valor da corrida</Text>
      <Text style={{ fontWeight: '800', fontSize: 27 }}>
        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Text>
      <Text style={s.h2}>Forma de pagamento</Text>
      {catalogLoading ? <Text style={s.muted}>Carregando formas de pagamento…</Text> : null}
      {methods.map(({ value, label }) => (
        <Pressable key={value} onPress={() => setMethod(value)}>
          <Card style={method === value ? { borderColor: '#087a50', borderWidth: 2 } : null}>
            <Text>{method === value ? '● ' : '○ '}{label}</Text>
          </Card>
        </Pressable>
      ))}
      {!catalogLoading && methods.length === 0 && !error
        ? <Text style={s.muted}>Nenhuma forma de pagamento está disponível.</Text>
        : null}
      <Text style={s.muted}>Modo de teste: registra a escolha na API sem processar uma cobrança real.</Text>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={confirmPayment} disabled={loading || catalogLoading || !rideId || !method}>
        {loading ? 'Registrando…' : 'Confirmar pagamento de teste'}
      </Button>
    </Page>
  );
}
