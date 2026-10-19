import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { api, updateStoredSession } from '../api';
import { Button, Card, Field, Page, s } from '../ui';

const emptyForm = {
  nome: '',
  email: '',
  cpf: '',
  numeroTelefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  senhaAtual: '',
  novaSenha: '',
  novaSenha_confirmation: '',
};

function formFromSession(data) {
  const address = data.enderecos?.[0] || {};
  return {
    ...emptyForm,
    nome: data.user?.nome || '',
    email: data.user?.email || '',
    cpf: data.user?.cpf || '',
    numeroTelefone: data.telefones?.[0]?.numeroTelefone || '',
    logradouro: address.logradouro || '',
    numero: address.numero || '',
    complemento: address.complemento || '',
    bairro: address.bairro || '',
    cidade: address.cidade || '',
    estado: address.estado || '',
    cep: address.cep || '',
  };
}

export default function Account({ go, session, setSession, onLogout }) {
  const [form, setForm] = useState(() => formFromSession(session));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [deactivationPassword, setDeactivationPassword] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/session')
      .then(({ data }) => {
        if (!active) return;
        setForm(formFromSession(data));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        numeroTelefone: form.numeroTelefone.replace(/\D/g, ''),
        cep: form.cep.replace(/\D/g, '') || null,
        novaSenha: form.novaSenha || null,
        novaSenha_confirmation: form.novaSenha_confirmation || null,
      };
      const { data } = await api.put('/account', payload);
      const nextSession = { ...session, ...data };
      setSession(nextSession);
      await updateStoredSession(nextSession);
      setForm(formFromSession(data));
      setNotice('Seus dados foram atualizados.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function deactivate() {
    setError('');
    setLoading(true);
    try {
      await api.delete('/account', { senhaAtual: deactivationPassword });
      await onLogout(false);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  }

  return (
    <Page title="Minha conta" go={go} back="Profile">
      <Text style={s.muted}>Altere seus dados ou desative sua conta. A senha atual é necessária para salvar as alterações.</Text>
      <Field label="Nome completo" value={form.nome} onChangeText={update('nome')} />
      <Field label="E-mail" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
      <Field label="CPF" value={form.cpf} onChangeText={update('cpf')} keyboardType="number-pad" />
      <Field label="Telefone com DDD" value={form.numeroTelefone} onChangeText={update('numeroTelefone')} keyboardType="phone-pad" />
      <Text style={s.h2}>Endereço</Text>
      <Field label="Logradouro" value={form.logradouro} onChangeText={update('logradouro')} />
      <Field label="Número" value={form.numero} onChangeText={update('numero')} />
      <Field label="Complemento" value={form.complemento} onChangeText={update('complemento')} />
      <Field label="Bairro" value={form.bairro} onChangeText={update('bairro')} />
      <Field label="Cidade" value={form.cidade} onChangeText={update('cidade')} />
      <Field label="Estado (UF)" value={form.estado} onChangeText={update('estado')} />
      <Field label="CEP" value={form.cep} onChangeText={(value) => update('cep')(value.replace(/\D/g, '').slice(0, 8))} keyboardType="number-pad" />
      <Text style={s.h2}>Alterar senha (opcional)</Text>
      <Field label="Nova senha" value={form.novaSenha} onChangeText={update('novaSenha')} secureTextEntry />
      <Field label="Confirmar nova senha" value={form.novaSenha_confirmation} onChangeText={update('novaSenha_confirmation')} secureTextEntry />
      <Field label="Senha atual" value={form.senhaAtual} onChangeText={update('senhaAtual')} secureTextEntry />
      {notice ? <Text style={{ color: '#087a50' }}>{notice}</Text> : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={save} disabled={loading}>{loading ? 'Salvando…' : 'Salvar alterações'}</Button>
      <Card style={{ borderColor: '#f0caca', borderWidth: 1 }}>
        <Text style={{ color: '#b42318', fontWeight: '700' }}>Desativar conta</Text>
        <Text style={s.muted}>A conta será desativada, você será desconectado e sua foto de perfil será removida. Os dados associados ao histórico das corridas serão mantidos. Para reativar a conta, fale com o suporte.</Text>
        {!confirmDeactivate ? (
          <Button light onPress={() => setConfirmDeactivate(true)}>Quero desativar minha conta</Button>
        ) : (
          <View style={{ gap: 10 }}>
            <Field label="Confirme sua senha atual" value={deactivationPassword} onChangeText={setDeactivationPassword} secureTextEntry />
            <Button onPress={deactivate} disabled={loading || !deactivationPassword}>Confirmar desativação</Button>
            <Button light onPress={() => setConfirmDeactivate(false)}>Cancelar</Button>
          </View>
        )}
      </Card>
    </Page>
  );
}
