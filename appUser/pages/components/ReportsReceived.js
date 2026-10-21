import { ThemedText as Text } from '../ui';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

const labels = { Seguranca: 'Segurança', Conduta: 'Conduta', Veiculo: 'Veículo', Rota: 'Rota', Outro: 'Outro' };

export default function ReportsReceived({ go }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const { data } = await api.getLive('/denuncias/recebidas'); setReports(data.denuncias || []); setError(''); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <Page title="Denúncias recebidas" go={go} back="Profile">
      <Text style={s.muted}>Lista de demonstração das denúncias vinculadas às suas corridas.</Text>
      {loading ? <Text style={s.muted}>Carregando…</Text> : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {!loading && reports.length === 0 ? <Text style={s.muted}>Nenhuma denúncia recebida.</Text> : null}
      {reports.map((report) => (
        <Card key={report.denunciaId}>
          <Text style={{ fontWeight: '800' }}>{labels[report.motivo] || report.motivo} · corrida #{report.corridaId}</Text>
          <Text style={s.muted}>Recebida de {report.reportadoPor === 'Passageiro' ? 'passageiro' : 'motorista'} · {report.dataHora}</Text>
          <Text>{report.descricao || 'Sem detalhes adicionais.'}</Text>
          <Text style={s.muted}>Status da corrida: {report.statusCorrida}</Text>
        </Card>
      ))}
      <Button light onPress={refresh}>Atualizar lista</Button>
    </Page>
  );
}
