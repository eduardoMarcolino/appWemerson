import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { api } from '../api';
import { Card, Metric, Page, red, s } from '../ui';

function Progress({ label, value, color = '#087a50' }) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.line}>
        <Text>{label}</Text>
        <Text style={{ fontWeight: '800' }}>{boundedValue}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${boundedValue}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function Performance({ go }) {
  const [performance, setPerformance] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/app-data')
      .then(({ data }) => setPerformance(data.desempenho))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <Page title="Desempenho" go={go}>
      {error ? <Text style={{ color: red }}>{error}</Text> : null}
      {!performance && !error ? <Text style={s.muted}>Carregando desempenho…</Text> : null}
      {performance ? (
        <>
          <Card>
            <Text style={s.muted}>Avaliação média</Text>
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#087a50' }}>
              ★ {performance.avaliacaoMedia.toFixed(1)}
            </Text>
          </Card>
          <Progress label="Taxa de conclusão" value={performance.taxaConclusao} />
          <Progress
            label="Taxa de cancelamento"
            value={performance.totalCorridas
              ? Math.round(performance.corridasCanceladas * 100 / performance.totalCorridas)
              : 0}
            color={red}
          />
          <Card>
            <Metric label="Corridas registradas" value={String(performance.totalCorridas)} strong />
          </Card>
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, backgroundColor: '#e5ebe8', borderRadius: 4 },
  fill: { height: 8, borderRadius: 4 },
});
