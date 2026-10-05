import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '../api';
import { Avatar, Button, Card, Nav, s } from '../ui';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Home({ go, session, online, setOnline }) {
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const [notificationWarning, setNotificationWarning] = useState('');
  const notificationsEnabled = useRef(false);
  const notifiedRideIds = useRef(new Set());
  const driver = session.motorista;

  useEffect(() => {
    if (!online || driver?.statusMotorista !== 'Aprovado') {
      setOffers([]);
      return undefined;
    }

    let active = true;
    async function refreshOffers() {
      try {
        const { data } = await api.get('/motorista/corridas/ofertas');
        if (!active) return;
        setOffers(data);
        setError('');
        for (const offer of data) {
          const id = offer.corrida.corridaId;
          if (!notifiedRideIds.current.has(id) && notificationsEnabled.current) {
            await Notifications.scheduleNotificationAsync({
              content: {
                  channelId: 'rides',
                  title: 'Nova solicitação de corrida',
                body: `${offer.corrida.origem} → ${offer.corrida.destino}`,
                data: { rideId: id },
              },
              trigger: null,
            });
            notifiedRideIds.current.add(id);
          }
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }

    refreshOffers();
    const timer = setInterval(refreshOffers, 7000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [driver?.statusMotorista, online]);

  async function toggleOnline() {
    setError('');
    setNotificationWarning('');
    if (online) {
      setOnline(false);
      return;
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('rides', {
          name: 'Solicitações de corrida',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const current = await Notifications.getPermissionsAsync();
      const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
      notificationsEnabled.current = permission.granted;
      if (!permission.granted) setNotificationWarning('Notificações desativadas; atualize as solicitações dentro do app.');
      setOnline(true);
    } catch (notificationError) {
      notificationsEnabled.current = false;
      setNotificationWarning(`Não foi possível configurar notificações: ${notificationError.message}`);
      setOnline(true);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#075c3e', padding: 20, paddingTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => go('SideMenu')}><Text style={{ color: '#fff', fontSize: 23 }}>☰</Text></Pressable>
        <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Olá, {session.user?.nome || 'motorista'}!</Text>
        <Switch value={online} onValueChange={toggleOnline} />
      </View>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar initials={session.user?.nome?.slice(0, 2).toUpperCase() || 'MO'} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800' }}>{session.user?.nome || 'Motorista'}</Text>
            <Text style={s.muted}>Status: {driver?.statusMotorista || 'indisponível'}</Text>
          </View>
        </Card>
        {driver?.statusMotorista !== 'Aprovado' ? (
          <Card><Text style={s.muted}>Seu cadastro aguarda aprovação para receber corridas.</Text></Card>
        ) : null}
        <Card>
          <Text style={{ fontWeight: '800' }}>Modo motorista</Text>
          <Text style={s.muted}>{online ? 'Online: buscando novas solicitações.' : 'Offline: ative para receber corridas.'}</Text>
          <Text style={s.muted}>Notificações locais informam novas ofertas enquanto este app estiver aberto.</Text>
        </Card>
        {notificationWarning ? <Text style={{ color: '#8a5a00' }}>{notificationWarning}</Text> : null}
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
        <Button onPress={() => go('NewRequest')} disabled={!online}>
          Ver solicitações ({offers.length})
        </Button>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['Corridas', 'History'],
            ['Agenda', 'Schedule'],
            ['Ganhos', 'Earnings'],
            ['Desempenho', 'Performance'],
          ].map(([label, page]) => (
            <Pressable key={page} onPress={() => go(page)} style={{ width: '48%', backgroundColor: '#eaf7f0', padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ color: '#087a50', fontWeight: '800' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Nav go={go} active="Home" />
    </View>
  );
}
