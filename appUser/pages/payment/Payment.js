import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

const methods = [
  ['Pix', 'Pix'],
  ['Dinheiro', 'Dinheiro'],
  ['CartaoCredito', 'Cartão de crédito (simulado)'],
  ['CartaoDebito', 'Cartão de débito (simulado)'],
  ['CarteiraDigital', 'Carteira digital (simulada)'],
];

export default function Payment({ go, session, setSession }) {
  const [method, setMethod] = useState('Pix');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const rideId = session.activeRide?.corrida?.corridaId;
  const amount = Number(session.activeRide?.corrida?.valorCorrida || 0);

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
      {methods.map(([key, label]) => (
        <Pressable key={key} onPress={() => setMethod(key)}>
          <Card style={method === key ? { borderColor: '#087a50', borderWidth: 2 } : null}>
            <Text>{method === key ? '● ' : '○ '}{label}</Text>
          </Card>
        </Pressable>
      ))}
      <Text style={s.muted}>Modo de teste: registra a escolha na API sem processar uma cobrança real.</Text>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={confirmPayment} disabled={loading || !rideId}>
        {loading ? 'Registrando…' : 'Confirmar pagamento de teste'}
      </Button>
    </Page>
  );
}
