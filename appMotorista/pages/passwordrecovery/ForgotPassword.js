import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { api } from '../api';
import { Button, Field, Page, s } from '../ui';

export default function ForgotPassword({ go }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setError('');
    setMessage('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/password/forgot', { email: email.trim().toLowerCase() });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Recuperar senha" go={go} back="Login">
      <Text style={s.muted}>Informe o e-mail cadastrado. Se houver uma conta, enviaremos um código temporário para redefinir a senha.</Text>
      <Field label="E-mail da conta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      {message ? <Text style={{ color: '#087a50' }}>{message}</Text> : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={requestCode} disabled={loading}>{loading ? 'Enviando…' : 'Enviar código'}</Button>
      <Button light onPress={() => go('ResetPassword')}>Já recebi o código</Button>
    </Page>
  );
}
