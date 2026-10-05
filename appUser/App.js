import React, { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import Home from './pages/home/Home';
import CityEvents from './pages/cityevents/CityEvents';
import Favorites from './pages/favorites/Favorites';
import History from './pages/history/History';
import Wallet from './pages/wallet/Wallet';
import Profile from './pages/profile/Profile';
import SearchDestination from './pages/searchdestination/SearchDestination';
import Schedule from './pages/schedule/Schedule';
import MeetingPoint from './pages/meetingpoint/MeetingPoint';
import Beneficiary from './pages/beneficiary/Beneficiary';
import Category from './pages/category/Category';
import SearchingDriver from './pages/searchingdriver/SearchingDriver';
import Payment from './pages/payment/Payment';
import RateDriver from './pages/ratedriver/RateDriver';
import { api, setAuthToken } from './pages/api';

const screens = { Login, Register, Home, CityEvents, Favorites, History, Wallet, Profile, SearchDestination, Schedule, MeetingPoint, Beneficiary, Category, SearchingDriver, Payment, RateDriver };
export default function App() {
  const [screen, setScreen] = useState('Login');
  const [session, setSession] = useState({
    user: null,
    activeRide: null,
    tripDraft: {
      origem: 'Praça da Matriz',
      latitudeOrigem: -23.5505,
      longitudeOrigem: -46.6333,
      destino: 'Shopping Jardins',
      latitudeDestino: -23.5614,
      longitudeDestino: -46.6559,
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
  async function logout() {
    let logoutError = null;
    try {
      await api.post('/logout', {});
    } catch (error) {
      logoutError = error;
    }
    setAuthToken(null);
    setSession((current) => ({ ...current, user: null, activeRide: null }));
    setScreen('Login');
    if (logoutError) {
      Alert.alert('Sessão local encerrada', `Não foi possível revogar o token na API: ${logoutError.message}`);
    }
  }
  const Screen = screens[screen] || Login;
  return <SafeAreaView style={styles.app}><StatusBar barStyle="dark-content" /><View style={styles.shell}><Screen go={setScreen} session={session} setSession={setSession} updateDraft={updateDraft} onLogout={logout} /></View></SafeAreaView>;
}
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#eaf0ed', alignItems: 'center' },
  shell: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#f7f8f7' },
});
