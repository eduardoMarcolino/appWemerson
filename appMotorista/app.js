import React, { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { api, setAuthToken } from './pages/api';
import Login from './pages/login/Login';
import RegisterDriver from './pages/register/RegisterDriver';
import Home from './pages/home/Home';
import NewRequest from './pages/newrequest/NewRequest';
import RideDetails from './pages/ridedetails/RideDetails';
import RideAccepted from './pages/rideaccepted/RideAccepted';
import StartRide from './pages/startride/StartRide';
import Trip from './pages/trip/Trip';
import FinishRide from './pages/finishride/FinishRide';
import RatePassenger from './pages/ratepassenger/RatePassenger';
import RideComplete from './pages/ridecomplete/RideComplete';
import Earnings from './pages/earnings/Earnings';
import History from './pages/history/History';
import Schedule from './pages/schedule/Schedule';
import Performance from './pages/performance/Performance';
import Profile from './pages/profile/Profile';
import SideMenu from './pages/sidemenu/SideMenu';

const screens = {
  Login, RegisterDriver, Home, NewRequest, RideDetails, RideAccepted, StartRide, Trip, FinishRide,
  RatePassenger, RideComplete, Earnings, History, Schedule, Performance, Profile, SideMenu,
};

export default function App() {
  const [screen, setScreen] = useState('Login');
  const [session, setSession] = useState({ user: null, motorista: null, activeRide: null });
  const [online, setOnline] = useState(false);
  async function logout() {
    let logoutError = null;
    try {
      await api.post('/logout', {});
    } catch (error) {
      logoutError = error;
    }
    setAuthToken(null);
    setSession({ user: null, motorista: null, activeRide: null });
    setOnline(false);
    setScreen('Login');
    if (logoutError) {
      Alert.alert('Sessão local encerrada', `Não foi possível revogar o token na API: ${logoutError.message}`);
    }
  }
  const Screen = screens[screen] || Login;
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle={screen === 'RideAccepted' ? 'light-content' : 'dark-content'} />
      <View style={styles.shell}><Screen go={setScreen} session={session} setSession={setSession} online={online} setOnline={setOnline} onLogout={logout} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#eaf0ed', alignItems: 'center' },
  shell: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#f7f8f7' },
});
