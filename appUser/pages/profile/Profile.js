import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Nav, Page } from '../ui';

const options = [
  'Endereços salvos',
  'Motoristas favoritos',
  'Formas de pagamento',
  'Promoções',
  'Notificações',
  'Ajuda',
  'Configurações',
];

export default function Profile({ go, session, onLogout }) {
  return (
    <View style={{ flex: 1 }}>
      <Page title="Perfil" go={go}>
        <Card style={{ backgroundColor: '#075c3e' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
            {session.user?.nome || 'Passageiro'}
          </Text>
          <Text style={{ color: '#d7efe3' }}>{session.user?.email || ''}</Text>
        </Card>
        {options.map((item) => (
          <Card key={item}><Text>{item} ›</Text></Card>
        ))}
        <Pressable onPress={onLogout}>
          <Text style={{ color: '#d22b2b', fontWeight: '700', padding: 10 }}>Sair da conta</Text>
        </Pressable>
      </Page>
      <Nav go={go} active="Profile" />
    </View>
  );
}
