import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Card, Nav, Page, s } from '../ui';

export default function Wallet({ go }) {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/app-data')
      .then(({ data }) => setPayments(data.pagamentos))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Page title="Pagamentos" go={go}>
        <Text style={s.h2}>Pagamentos registrados</Text>
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
        {payments.length === 0 && !error ? <Text style={s.muted}>Ainda não há pagamentos registrados na sua conta.</Text> : null}
        {payments.map(({ pagamento, corrida }) => (
          <Card key={pagamento.pagamentoId}>
            <Text style={{ fontWeight: '700' }}>{corrida.origem} → {corrida.destino}</Text>
            <Text style={s.muted}>{pagamento.dataPagamento ? new Date(pagamento.dataPagamento).toLocaleString('pt-BR') : 'Pagamento pendente'}</Text>
            <Text style={s.muted}>{pagamento.formaPagamento} · {pagamento.statusPagamento}</Text>
            <Text style={{ fontWeight: '800', textAlign: 'right' }}>
              {Number(pagamento.valorPago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </Card>
        ))}
      </Page>
      <Nav go={go} />
    </View>
  );
}
