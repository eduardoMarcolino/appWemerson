import { ThemedText as Text } from './pages/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { api, clearStoredSession, loadRememberedSession, persistSession, setAuthToken, setAuthenticationExpiredHandler, setCacheFallbackHandler } from './pages/api';
import Login from './pages/login/Login';
import ForgotPassword from './pages/passwordrecovery/ForgotPassword';
import ResetPassword from './pages/passwordrecovery/ResetPassword';
import RegisterDriver from './pages/register/RegisterDriver';
import Home from './pages/home/Home';
import NewRequest from './pages/newrequest/NewRequest';
import RideDetails from './pages/ridedetails/RideDetails';
import RideAccepted from './pages/rideaccepted/RideAccepted';
import StartRide from './pages/startride/StartRide';
import Trip from './pages/trip/Trip';
import FinishRide from './pages/finishride/FinishRide';
import RatePassenger from './pages/ratepassenger/RatePassenger';
import ReportsReceived from './pages/components/ReportsReceived';
import RideComplete from './pages/ridecomplete/RideComplete';
import Earnings from './pages/earnings/Earnings';
import History from './pages/history/History';
import Schedule from './pages/schedule/Schedule';
import Performance from './pages/performance/Performance';
import Profile from './pages/profile/Profile';
import Account from './pages/account/Account';
import SideMenu from './pages/sidemenu/SideMenu';
import ActiveRideSheet from './pages/components/ActiveRideSheet';
import useRideLocationShare from './pages/utils/useRideLocationShare';
import usePushNotifications from './pages/utils/usePushNotifications';
import { getThemeColors, setColorScheme } from './pages/ui';

const screens = {
  Login, ForgotPassword, ResetPassword, RegisterDriver, Home, NewRequest, RideDetails, RideAccepted, StartRide, Trip, FinishRide,
  RatePassenger, RideComplete, Earnings, History, Schedule, Performance, Profile, Account, SideMenu, Reports: ReportsReceived,
};

export default function App() {
  const colorScheme = useColorScheme();
  setColorScheme(colorScheme);
  const theme = getThemeColors(colorScheme);
  const [screen, setScreen] = useState('Login');
  const [restoring, setRestoring] = useState(true);
  const [sheetRide, setSheetRide] = useState(null);
  const [session, setSession] = useState({ user: null, motorista: null, activeRide: null });
  const locationShareMessage = useRideLocationShare({
    rideId: session.activeRide?.corrida?.corridaId,
    status: session.activeRide?.corrida?.status,
    type: 'Motorista',
    setSession,
  });
  const handlePushResponse = useCallback(async () => {
    if (!session.user?.userId) return;
    try {
      const { data } = await api.getLive('/corridas/ativa');
      if (!data.activeRide) {
        setSession((current) => ({ ...current, activeRide: null }));
        setScreen('History');
        return;
      }
      const ride = data.activeRide.corrida;
      setSession((current) => ({ ...current, activeRide: data.activeRide }));
      setScreen(ride.status === 'EmAndamento' ? 'Trip' : ride.status === 'MotoristaChegando' ? 'StartRide' : 'RideAccepted');
    } catch (_error) { setScreen('Home'); }
  }, [session.user?.userId]);
  const unregisterPushToken = usePushNotifications(session.user?.userId, handlePushResponse);
  const [online, setOnline] = useState(false);
  const validationWarningShown = useRef(false);
  useEffect(() => {
    let active = true;
    setAuthenticationExpiredHandler(() => {
      clearStoredSession()
        .then(() => {
          setAuthToken(null);
          setSession({ user: null, motorista: null, activeRide: null });
          setSheetRide(null);
          setOnline(false);
          setScreen('Login');
          if (active) Alert.alert('Sessão encerrada', 'Sua conta não está mais disponível.');
        })
        .catch((error) => Alert.alert('Erro ao encerrar sessão', error.message));
    });
    setCacheFallbackHandler(() => {
      Alert.alert('Modo offline', 'Exibindo os últimos dados salvos neste dispositivo; eles podem estar desatualizados.');
    });
    async function restoreSession() {
      try {
        const saved = await loadRememberedSession();
        if (!saved) return;

        try {
          const { data } = await api.get('/session');
          const { data: activeRideData } = await api.getLive('/corridas/ativa');
          const restored = { ...data, activeRide: activeRideData.activeRide };
          await persistSession(saved.token, restored, true, saved.expiresAt);
          if (active) {
            setSession(restored);
            setScreen('Home');
          }
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            await clearStoredSession();
            setAuthToken(null);
            return;
          }
          if (active) {
            setSession({ ...saved.session, activeRide: null });
            setScreen('Home');
            Alert.alert('Modo offline', `Não foi possível validar a sessão com a API: ${error.message}`);
          }
        }
      } catch (error) {
        Alert.alert('Erro ao restaurar sessão', error.message);
      } finally {
        if (active) setRestoring(false);
      }
    }
    restoreSession();
    return () => {
      active = false;
      setAuthenticationExpiredHandler(null);
      setCacheFallbackHandler(null);
    };
  }, []);
  useEffect(() => {
    setSheetRide(session.activeRide);
  }, [session.activeRide]);
  const cancellationNotice = useRef(null);
  useEffect(() => {
    const rideId = session.activeRide?.corrida?.corridaId;
    const initialStatus = session.activeRide?.corrida?.status;
    if (!rideId || !session.user?.userId || !['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento'].includes(initialStatus)) return undefined;
    let active = true;
    let pending = false;
    async function refreshRideStatus() {
      if (pending) return;
      pending = true;
      try {
        const { data } = await api.getLive(`/corridas/${rideId}`);
        if (!active) return;
        setSession((current) => ({ ...current, activeRide: data }));
        if (data.corrida.status === 'Cancelada') {
          setSheetRide(null);
          if (cancellationNotice.current !== rideId) {
            cancellationNotice.current = rideId;
            Alert.alert('Corrida cancelada', data.corrida.motivoCancelamento || 'O outro participante cancelou a corrida.');
          }
        }
      } catch (_error) { /* A tela conserva a última situação se a API estiver temporariamente indisponível. */ }
      finally { pending = false; }
    }
    refreshRideStatus();
    const timer = setInterval(refreshRideStatus, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [session.activeRide?.corrida?.corridaId, session.activeRide?.corrida?.status, session.user?.userId]);
  useEffect(() => {
    if (!session.user?.userId) return undefined;
    let active = true;
    let requestPending = false;
    async function refreshActiveRide() {
      if (requestPending) return;
      requestPending = true;
      try {
        const { data } = await api.getLive('/corridas/ativa');
        if (active) {
          setSheetRide(data.activeRide);
          if (data.activeRide) {
            setSession((current) => ({ ...current, activeRide: data.activeRide }));
          }
        }
      } catch (_error) {
        // Mantém a última corrida conhecida se a API estiver temporariamente indisponível.
      } finally {
        requestPending = false;
      }
    }
    refreshActiveRide();
    const timer = setInterval(refreshActiveRide, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session.user?.userId]);
  useEffect(() => {
    if (!session.user?.userId) return undefined;
    let active = true;
    async function validateSession() {
      try {
        const { data } = await api.get('/session');
        validationWarningShown.current = false;
        if (active) setSession((current) => ({ ...current, ...data }));
      } catch (error) {
        if (error.status === 401 || error.status === 403) return;
        if (active && !validationWarningShown.current) {
          validationWarningShown.current = true;
          Alert.alert('Não foi possível validar a sessão', error.message);
        }
      }
    }
    const timer = setInterval(validateSession, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session.user?.userId]);
  async function logout(revokeRemote = true) {
    let logoutError = null;
    await unregisterPushToken();
    if (revokeRemote) {
      try {
        await api.post('/logout', {});
      } catch (error) {
        logoutError = error;
      }
    }
    try {
      await clearStoredSession();
    } catch (error) {
      logoutError = logoutError || error;
    }
    setAuthToken(null);
    setSession({ user: null, motorista: null, activeRide: null });
    setSheetRide(null);
    setOnline(false);
    setScreen('Login');
    if (logoutError) {
      Alert.alert('Sessão local encerrada', `Não foi possível revogar o token na API: ${logoutError.message}`);
    }
  }
  const Screen = screens[screen] || Login;
  return (
    <SafeAreaView style={[styles.app, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' || screen === 'RideAccepted' ? 'light-content' : 'dark-content'} />
      <View style={[styles.shell, { backgroundColor: theme.background }]}>
        {restoring ? (
          <View style={styles.loading}><ActivityIndicator color="#087a50" /><Text>Verificando sessão…</Text></View>
        ) : (
          <View style={styles.screenContainer}>
            <Screen go={setScreen} session={session} setSession={setSession} online={online} setOnline={setOnline} onLogout={logout} locationShareMessage={locationShareMessage} />
            <ActiveRideSheet activeRide={sheetRide} go={setScreen} locationShareMessage={locationShareMessage} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#eaf0ed', alignItems: 'center' },
  shell: { flex: 1, width: '100%', maxWidth: 900, backgroundColor: '#f7f8f7' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  screenContainer: { flex: 1, position: 'relative' },
});
