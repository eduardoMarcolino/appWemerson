import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, Switch, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Card, getThemeColors, Page, s } from '../ui';

export default function Schedule({ go, session, updateDraft }) {
  const colorScheme = useColorScheme();
  const theme = getThemeColors(colorScheme);
  const [scheduled, setScheduled] = useState(Boolean(session.tripDraft.dataHora));
  const [dateTime, setDateTime] = useState(() => {
    const saved = session.tripDraft.dataHora ? new Date(session.tripDraft.dataHora) : null;
    return saved && !Number.isNaN(saved.getTime()) ? saved : new Date(Date.now() + 60 * 60 * 1000);
  });
  const [pickerMode, setPickerMode] = useState(null);
  const [pendingDateTime, setPendingDateTime] = useState(dateTime);
  const [error, setError] = useState('');

  function changeDateTime(event, selectedDate) {
    if (event.type === 'set' && selectedDate) {
      if (Platform.OS === 'ios') setPendingDateTime(selectedDate);
      else setDateTime(selectedDate);
    }
    if (Platform.OS !== 'ios') setPickerMode(null);
  }

  function openPicker(mode) {
    setPendingDateTime(dateTime);
    setPickerMode(mode);
  }

  function confirmPicker() {
    setDateTime(pendingDateTime);
    setPickerMode(null);
  }

  const localDateTime = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  function continueToPickup() {
    setError('');
    if (scheduled) {
      if (Number.isNaN(dateTime.getTime()) || dateTime <= new Date()) {
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
          {Platform.OS === 'web' ? (
            <>
              <Text style={s.fieldLabel}>Data e horário</Text>
              {React.createElement('input', {
                type: 'datetime-local',
                value: localDateTime,
                min: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
                onChange: (event) => {
                  const nextDate = new Date(event.target.value);
                  if (!Number.isNaN(nextDate.getTime())) setDateTime(nextDate);
                },
                style: {
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: theme.surface,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 14,
                },
              })}
            </>
          ) : (
            <>
              <Button light onPress={() => openPicker('date')}>
                Data: {dateTime.toLocaleDateString('pt-BR')}
              </Button>
              <Button light onPress={() => openPicker('time')}>
                Horário: {dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Button>
            </>
          )}
          {Platform.OS === 'ios' ? (
            <Modal transparent visible={Boolean(pickerMode)} animationType="slide" onRequestClose={() => setPickerMode(null)}>
              <Pressable
                onPress={() => setPickerMode(null)}
                style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}
              >
                <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface, padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                  <DateTimePicker
                    value={pendingDateTime}
                    mode={pickerMode || 'date'}
                    display="spinner"
                    onChange={changeDateTime}
                    locale="pt-BR"
                    minimumDate={pickerMode === 'date' ? new Date() : undefined}
                  />
                  <Button onPress={confirmPicker}>Confirmar</Button>
                </Pressable>
              </Pressable>
            </Modal>
          ) : pickerMode ? (
            <DateTimePicker
              value={dateTime}
              mode={pickerMode}
              display="default"
              onChange={changeDateTime}
              minimumDate={pickerMode === 'date' ? new Date() : undefined}
              is24Hour
            />
          ) : null}
        </>
      ) : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={continueToPickup}>Continuar</Button>
    </Page>
  );
}
