import React, { useState } from 'react';
import { Switch, Text, TextInput } from 'react-native';
import { Button, Card, Page, s } from '../ui';

export default function Schedule({ go, session, updateDraft }) {
  const [scheduled, setScheduled] = useState(Boolean(session.tripDraft.dataHora));
  const [dateTime, setDateTime] = useState(session.tripDraft.dataHora?.slice(0, 16) || '');
  const [error, setError] = useState('');

  function continueToPickup() {
    setError('');
    if (scheduled) {
      const date = new Date(dateTime);
      if (!dateTime || Number.isNaN(date.getTime()) || date <= new Date()) {
        setError('Informe uma data e horário futuros.');
        return;
      }
      updateDraft({ dataHora: date.toISOString() });
    } else {
      updateDraft({ dataHora: null });
    }
    go('MeetingPoint');
  }

  return (
    <Page title="Data e horário" go={go} back="SearchDestination">
      <Text style={s.h2}>Quando deseja viajar?</Text>
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text>{scheduled ? 'Agendar corrida' : 'Viajar agora'}</Text>
        <Switch value={scheduled} onValueChange={setScheduled} />
      </Card>
      {scheduled ? (
        <>
          <Text style={s.muted}>Data e horário local</Text>
          <TextInput
            value={dateTime}
            onChangeText={setDateTime}
            placeholder="AAAA-MM-DDTHH:MM"
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8e4', borderRadius: 10, padding: 14 }}
          />
          <Text style={s.muted}>Exemplo: 2026-10-06T09:30</Text>
        </>
      ) : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={continueToPickup}>Continuar</Button>
    </Page>
  );
}
