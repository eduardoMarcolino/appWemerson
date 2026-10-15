import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import Home from './pages/home/Home';
import CityEvents from './pages/cityevents/CityEvents';
import Favorites from './pages/favorites/Favorites';
import History from './pages/history/History';
import Wallet from './pages/wallet/Wallet';
import Profile from './pages/profile/Profile';
import Account from './pages/account/Account';
import SearchDestination from './pages/searchdestination/SearchDestination';
import Schedule from './pages/schedule/Schedule';
import MeetingPoint from './pages/meetingpoint/MeetingPoint';
import Beneficiary from './pages/beneficiary/Beneficiary';
import Category from './pages/category/Category';
import SearchingDriver from './pages/searchingdriver/SearchingDriver';
import Payment from './pages/payment/Payment';
import RateDriver from './pages/ratedriver/RateDriver';
import { api, clearStoredSession, loadRememberedSession, persistSession, setAuthToken, setAuthenticationExpiredHandler, setCacheFallbackHandler } from './pages/api';

const screens = { Login, Register, Home, CityEvents, Favorites, History, Wallet, Profile, Account, SearchDestination, Schedule, MeetingPoint, Beneficiary, Category, SearchingDriver, Payment, RateDriver };
export default function App() {
  const [screen, setScreen] = useState('Login');
  const [restoring, setRestoring] = useState(true);
  const validationWarningShown = useRef(false);
  const [session, setSession] = useState({
    user: null,
    activeRide: null,
    tripDraft: {
      origem: '',
      latitudeOrigem: null,
      longitudeOrigem: null,
      destino: '',
      latitudeDestino: null,
      longitudeDestino: null,
      categoria: 'Economico',
      dataHora: null,
      beneficiarioNome: null,
      beneficiarioTelefone: null,
    },
  });
  const updateDraft = (values) => setSession((current) => ({
    ...current,
    tripDraft: { ...current.tripDraft, ...values },
  }));
  useEffect(() => {
    let active = true;
    setAuthenticationExpiredHandler(() => {
      clearStoredSession()
        .then(() => {
          setAuthToken(null);
          setSession((current) => ({ ...current, user: null, activeRide: null }));
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
          const restored = { ...data, activeRide: null };
          await persistSession(saved.token, restored, true);
          if (active) {
            setSession((current) => ({ ...current, ...restored }));
            setScreen('Home');
          }
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            await clearStoredSession();
            setAuthToken(null);
            return;
          }
          if (active) {
            setSession((current) => ({ ...current, ...saved.session }));
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
    setSession((current) => ({ ...current, user: null, activeRide: null }));
    setScreen('Login');
    if (logoutError) {
      Alert.alert('Sessão local encerrada', `Não foi possível revogar o token na API: ${logoutError.message}`);
    }
  }
  const Screen = screens[screen] || Login;
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.shell}>
        {restoring ? (
          <View style={styles.loading}><ActivityIndicator color="#087a50" /><Text>Verificando sessão…</Text></View>
        ) : (
          <Screen go={setScreen} session={session} setSession={setSession} updateDraft={updateDraft} onLogout={logout} />
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#eaf0ed', alignItems: 'center' },
  shell: { flex: 1, width: '100%', maxWidth: 900, backgroundColor: '#f7f8f7' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
