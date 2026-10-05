import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Button, Card, Field, Page, s } from '../ui';

export default function Beneficiary({ go, session, updateDraft }) {
  const [otherPerson, setOtherPerson] = useState(Boolean(session.tripDraft.beneficiarioNome));
  const [name, setName] = useState(session.tripDraft.beneficiarioNome || '');
  const [phone, setPhone] = useState(session.tripDraft.beneficiarioTelefone || '');
  const [error, setError] = useState('');

  function continueToCategory() {
    if (otherPerson && (!name.trim() || phone.replace(/\D/g, '').length < 10)) {
      setError('Informe o nome e um telefone válido do beneficiário.');
      return;
    }
    updateDraft({
      beneficiarioNome: otherPerson ? name.trim() : null,
      beneficiarioTelefone: otherPerson ? phone.trim() : null,
    });
    go('Category');
  }

  return (
    <Page title="Para quem é a corrida?" go={go} back="MeetingPoint">
      <Pressable onPress={() => setOtherPerson(false)}>
        <Card><Text>{otherPerson ? '○' : '●'} Para mim</Text></Card>
      </Pressable>
      <Pressable onPress={() => setOtherPerson(true)}>
        <Card><Text>{otherPerson ? '●' : '○'} Para outra pessoa</Text></Card>
      </Pressable>
      {otherPerson ? (
        <>
          <Text style={s.muted}>Nome completo do beneficiário</Text>
          <Field placeholder="Nome completo" value={name} onChangeText={setName} />
          <Text style={s.muted}>Telefone</Text>
          <Field placeholder="Telefone com DDD" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </>
      ) : null}
      <Text style={s.muted}>O motorista verá essas informações durante a corrida.</Text>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={continueToCategory}>Confirmar</Button>
    </Page>
  );
}
