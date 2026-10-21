import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { api } from '../api';
import { Button, Field, Page, s } from '../ui';

export default function ResetPassword({ go }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resetPassword() {
    setError('');
    if (!email.trim() || !token.trim()) {
      setError('Informe o e-mail e o código recebido.');
      return;
    }
    if (password.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password/reset', {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Criar nova senha" go={go} back="ForgotPassword">
      <Text style={s.muted}>Use o mesmo e-mail informado ao pedir o código. Ele expira em 15 minutos e só funciona uma vez.</Text>
      <Field label="E-mail da conta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Código recebido por e-mail" value={token} onChangeText={setToken} autoCapitalize="none" />
      <Field label="Nova senha (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Confirme a nova senha" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />
      {success ? <Text style={{ color: '#087a50' }}>Senha redefinida. Entre novamente com a nova senha.</Text> : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {success
        ? <Button onPress={() => go('Login')}>Voltar ao login</Button>
        : <Button onPress={resetPassword} disabled={loading}>{loading ? 'Salvando…' : 'Redefinir senha'}</Button>}
    </Page>
  );
}
