import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, useWindowDimensions, View, StyleSheet } from 'react-native';
import { Button, Field, green, s } from '../ui';
import { api, persistSession } from '../api';

export default function Login({ go, setSession }) {
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  async function entrar() {
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Informe e-mail (ou CPF) e senha.');
      return;
    }
    setLoading(true);
    try {
      const { data, status } = await api.post('/loginPassageiro', {
        email: email.trim(),
        senha,
      });
      if (status === 200 && data?.success) {
        const nextSession = { user: data.user, passageiro: data.passageiro, activeRide: null };
        await persistSession(data.token, nextSession, rememberMe);
        setSession((current) => ({ ...current, ...nextSession }));
        go('Home');
      } else {
        setErro(data?.message || 'Não foi possível entrar. Tente novamente.');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={x.scrollView} contentContainerStyle={x.scroll} keyboardShouldPersistTaps="handled">
      <View style={x.page}>
        <View style={[x.hero, { height: Math.min(Math.max(height * 0.32, 150), 280) }]}>
          <Text style={x.logo}>📍 InteriorGo</Text>
          <Text style={x.road}>🚗 🏘️</Text>
        </View>

        <View style={x.form}>
          <Text style={s.h2}>Bem-vindo(a)!</Text>
          <Text style={s.muted}>Entre para continuar</Text>

          <Field label="E-mail ou CPF" placeholder="Digite seu e-mail ou CPF" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Senha" placeholder="Digite sua senha" secureTextEntry value={senha} onChangeText={setSenha} />
          <View style={x.rememberRow}>
            <Switch value={rememberMe} onValueChange={setRememberMe} />
            <Text style={s.muted}>Manter conectado neste dispositivo</Text>
          </View>

          <Text style={x.link}>Esqueceu a senha?</Text>

          {erro ? <Text style={x.error}>{erro}</Text> : null}

          <Button onPress={entrar} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Entrar'}
          </Button>

          <Text style={x.signup}>
            Não tem uma conta?{' '}
            <Text style={x.link} onPress={() => go('Register')}>
              Cadastre-se
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const x = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: '#fff' },
  page: { flexGrow: 1, backgroundColor: '#fff' },
  hero: {
    backgroundColor: '#edf7f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontWeight: '800',
    fontSize: 29,
    color: green,
  },
  road: {
    fontSize: 42,
    marginTop: 30,
  },
  form: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 24,
    gap: 13,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  link: {
    color: green,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
  },
  signup: {
    textAlign: 'center',
    color: '#3d4a44',
    fontSize: 13,
    marginTop: 4,
  },
  error: {
    color: '#d94b45',
    fontSize: 12,
    textAlign: 'center',
  },
});
