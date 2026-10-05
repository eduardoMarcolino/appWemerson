import React, { useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet, Pressable } from 'react-native';
import { Button, Field, green, s } from '../ui';
import { api, setAuthToken } from '../api';

export default function Login({ go, setSession }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

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
        setAuthToken(data.token);
        setSession((current) => ({ ...current, user: data.user, activeRide: null }));
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
    <View style={x.page}>
      <View style={x.hero}>
        <Text style={x.logo}>📍 InteriorGo</Text>
        <Text style={x.road}>🚗 🏘️</Text>
      </View>

      <View style={x.form}>
        <Text style={s.h2}>Bem-vindo(a)!</Text>
        <Text style={s.muted}>Entre para continuar</Text>

        <Field placeholder="E-mail ou CPF" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

        <Text style={x.link}>Esqueceu a senha?</Text>

        {erro ? <Text style={x.error}>{erro}</Text> : null}

        <Button onPress={entrar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Entrar'}
        </Button>

        <Text style={x.or}>ou entre com</Text>
        <Pressable style={x.social}>
          <Text>ⓖ Google | ● Facebook</Text>
        </Pressable>

        <Text style={x.signup}>
          Não tem uma conta?{' '}
          <Text style={x.link} onPress={() => go('Register')}>
            Cadastre-se
          </Text>
        </Text>
      </View>
    </View>
  );
}

const x = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hero: {
    height: '38%',
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
    flex: 1,
    padding: 24,
    gap: 13,
  },
  link: {
    color: green,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
  },
  or: {
    textAlign: 'center',
    color: '#75827c',
    fontSize: 12,
  },
  social: {
    borderWidth: 1,
    borderColor: '#e2e9e5',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
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
