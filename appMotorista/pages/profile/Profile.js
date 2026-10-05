import React from 'react';
import { Text } from 'react-native';
import { Avatar, Button, Card, Page, s } from '../ui';

export default function Profile({ go, session, onLogout }) {
  return (
    <Page title="Perfil" go={go} nav="Profile">
      <Card style={{ backgroundColor: '#075c3e', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials={session.user?.nome?.slice(0, 2).toUpperCase() || 'MO'} />
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', flex: 1 }}>
          {session.user?.nome || 'Motorista'}{' \n'}
          <Text style={{ color: '#d7efe3', fontSize: 12, fontWeight: '400' }}>
            {session.user?.email || ''}
          </Text>
        </Text>
        <Text style={{ color: '#fff' }}>★ {session.motorista?.avaliacaoMedia ?? '—'}</Text>
      </Card>
      <Card><Text style={{ fontWeight: '700' }}>CNH: {session.motorista?.cnh || 'Não informada'}</Text></Card>
      <Card><Text style={{ fontWeight: '700' }}>Status: {session.motorista?.statusMotorista || 'Indisponível'}</Text></Card>
      <Button danger onPress={onLogout}>Sair da conta</Button>
    </Page>
  );
}
