import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, useColorScheme, useWindowDimensions, View } from 'react-native';
import { api, persistSession } from '../api';
import { Button, Field, getThemeColors, green, s } from '../ui';

export default function Login({ go, setSession }) {
  const { height } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const theme = getThemeColors(colorScheme);
  const linkColor = colorScheme === 'dark' ? '#92d3b3' : green;
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [visibilidade, setVisibilidade] = useState(true);

  async function enter() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/loginMotorista', { email: email.trim(), senha });
      const nextSession = { user: data.user, motorista: data.motorista, activeRide: null };
      await persistSession(data.token, nextSession, rememberMe);
      setSession(nextSession);
      go('Home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[x.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[x.scroll, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[x.page, { backgroundColor: theme.background }]}>
        <View style={[x.hero, { height: Math.min(Math.max(height * 0.32, 150), 280), backgroundColor: colorScheme === 'dark' ? theme.surface : '#edf7f1' }]}>
          <Text style={[x.logo, { color: linkColor }]}>InteriorGo</Text>
          <Text style={[x.tagline, { color: theme.secondaryText }]}>Seu caminho pelo interior</Text>
          <Text style={x.car}>🚗</Text>
        </View>
        <View style={x.form}>
          <Text style={[x.welcome, { color: theme.text }]}>Olá, motorista!</Text>
          <Text style={s.muted}>Entre para começar</Text>
          <Field style={x.field} label="E-mail" placeholder="voce@exemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field style={x.field} label="Senha" placeholder="Digite sua senha" value={senha} onChangeText={setSenha} secureTextEntry={!visibilidade} />
          <Pressable onPress={() => setVisibilidade(!visibilidade)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={s.muted}>Mostrar senha</Text>
          </Pressable>
          <View style={x.rememberRow}>
            <Switch value={rememberMe} onValueChange={setRememberMe} />
            <Text style={s.muted}>Manter conectado neste dispositivo</Text>
          </View>
          {error ? <Text style={x.error}>{error}</Text> : null}
          <Button onPress={enter} disabled={loading || !email.trim() || !senha}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
          <Text style={[x.or, { color: theme.secondaryText }]}>Entre com sua conta de motorista</Text>
          <Pressable onPress={() => go('RegisterDriver')}>
            <Text style={[x.signup, { color: theme.secondaryText }]}>Não tem conta? <Text style={[x.link, { color: linkColor }]}>Cadastre-se</Text></Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const x = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: '#fff' },
  page: { flexGrow: 1, backgroundColor: '#fff' },
  hero: { backgroundColor: '#edf7f1', alignItems: 'center', justifyContent: 'center' },
  logo: { color: green, fontSize: 31, fontWeight: '900' },
  tagline: { color: '#48715f', marginTop: 4 },
  car: { fontSize: 54, marginTop: 28 },
  form: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, gap: 13 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  welcome: { fontSize: 21, fontWeight: '800', color: '#14231d' },
  error: { color: '#d94b45', textAlign: 'center', fontSize: 12 },
  link: { color: green, fontWeight: '800' },
  or: { color: '#75827c', fontSize: 12, textAlign: 'center' },
  signup: { fontSize: 12, color: '#6b7771', textAlign: 'center' },
});
