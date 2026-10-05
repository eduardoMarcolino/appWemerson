import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api, setAuthToken } from '../api';
import { Button, Field, green, s } from '../ui';

export default function Login({ go, setSession }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function enter() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/loginMotorista', { email: email.trim(), senha });
      setAuthToken(data.token);
      setSession({ user: data.user, motorista: data.motorista, activeRide: null });
      go('Home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={x.page}>
      <View style={x.hero}>
        <Text style={x.logo}>InteriorGo</Text>
        <Text style={x.tagline}>Seu caminho pelo interior</Text>
        <Text style={x.car}>🚗</Text>
      </View>
      <View style={x.form}>
        <Text style={x.welcome}>Olá, motorista!</Text>
        <Text style={s.muted}>Entre para começar</Text>
        <Field placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
        {error ? <Text style={x.error}>{error}</Text> : null}
        <Button onPress={enter} disabled={loading || !email.trim() || !senha}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
        <Text style={x.or}>Entre com sua conta de motorista</Text>
        <Pressable onPress={() => go('RegisterDriver')}>
          <Text style={x.signup}>Não tem conta? <Text style={x.link}>Cadastre-se</Text></Text>
        </Pressable>
      </View>
    </View>
  );
}

const x = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  hero: { height: '42%', backgroundColor: '#edf7f1', alignItems: 'center', justifyContent: 'center' },
  logo: { color: green, fontSize: 31, fontWeight: '900' },
  tagline: { color: '#48715f', marginTop: 4 },
  car: { fontSize: 54, marginTop: 28 },
  form: { padding: 24, gap: 13 },
  welcome: { fontSize: 21, fontWeight: '800', color: '#14231d' },
  error: { color: '#d94b45', textAlign: 'center', fontSize: 12 },
  link: { color: green, fontWeight: '800' },
  or: { color: '#75827c', fontSize: 12, textAlign: 'center' },
  signup: { fontSize: 12, color: '#6b7771', textAlign: 'center' },
});
