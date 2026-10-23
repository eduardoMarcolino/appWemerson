import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { Switch } from 'react-native';
import { Button, Card, Field, Page, s } from '../ui';
import { formatDateInput, formatTimeInput, parseDateTimeInput } from '../utils/dateInput';

function nextHour() {
  return new Date(Date.now() + 60 * 60 * 1000);
}

function displayDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function displayTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function savedDateTime(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : nextHour();
}

export default function Schedule({ go, session, updateDraft }) {
  const [scheduled, setScheduled] = useState(Boolean(session.tripDraft.dataHora));
  const [dateText, setDateText] = useState(() => displayDate(savedDateTime(session.tripDraft.dataHora)));
  const [timeText, setTimeText] = useState(() => displayTime(savedDateTime(session.tripDraft.dataHora)));
  const [error, setError] = useState('');

  function continueToPickup() {
    setError('');
    if (scheduled) {
      const dateTime = parseDateTimeInput(dateText, timeText);
      if (!dateTime) {
        setError('Informe uma data válida em dd/mm/aaaa e um horário em hh:mm.');
        return;
      }
      if (dateTime <= new Date()) {
        setError('Informe uma data e horário futuros.');
        return;
      }
      updateDraft({ dataHora: dateTime.toISOString() });
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
          <Text style={s.h2}>Data e horário local</Text>
          <Field
            label="Data (dd/mm/aaaa)"
            placeholder="dd/mm/aaaa"
            value={dateText}
            onChangeText={(value) => setDateText(formatDateInput(value))}
            keyboardType="number-pad"
            maxLength={10}
          />
          <Field
            label="Horário (hh:mm)"
            placeholder="hh:mm"
            value={timeText}
            onChangeText={(value) => setTimeText(formatTimeInput(value))}
            keyboardType="number-pad"
            maxLength={5}
          />
        </>
      ) : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={continueToPickup}>Continuar</Button>
    </Page>
  );
}
