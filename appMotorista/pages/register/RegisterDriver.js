import React, { useState } from 'react';
import { Text } from 'react-native';
import { api, setAuthToken } from '../api';
import { Button, Card, Field, Page, s } from '../ui';

const initialForm = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  numeroTelefone: '',
  logradouro: '',
  cnh: '',
  validadeCNH: '',
  marca: '',
  modelo: '',
  placa: '',
  cor: '',
  anoFabricacao: '',
  anoModelo: '',
  categoria: 'Economico',
};

export default function RegisterDriver({ go, setSession }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function register() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        anoFabricacao: form.anoFabricacao ? Number(form.anoFabricacao) : null,
        anoModelo: form.anoModelo ? Number(form.anoModelo) : null,
      };
      const { data } = await api.post('/motorista/insert', payload);
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
    <Page title="Cadastro de motorista" go={go} back="Login">
      <Text style={s.h2}>Dados pessoais</Text>
      <Field placeholder="Nome completo" value={form.nome} onChangeText={update('nome')} />
      <Field placeholder="E-mail" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
      <Field placeholder="Senha (mínimo 6 caracteres)" value={form.senha} onChangeText={update('senha')} secureTextEntry />
      <Field placeholder="CPF (11 dígitos)" value={form.cpf} onChangeText={update('cpf')} keyboardType="number-pad" />
      <Field placeholder="Telefone com DDD" value={form.numeroTelefone} onChangeText={update('numeroTelefone')} keyboardType="phone-pad" />
      <Field placeholder="Endereço (logradouro)" value={form.logradouro} onChangeText={update('logradouro')} />
      <Text style={s.h2}>CNH e veículo</Text>
      <Field placeholder="Número da CNH" value={form.cnh} onChangeText={update('cnh')} />
      <Field placeholder="Validade da CNH (AAAA-MM-DD)" value={form.validadeCNH} onChangeText={update('validadeCNH')} />
      <Field placeholder="Marca do veículo" value={form.marca} onChangeText={update('marca')} />
      <Field placeholder="Modelo do veículo" value={form.modelo} onChangeText={update('modelo')} />
      <Text style={s.h2}>Categoria do veículo</Text>
      {['Economico', 'Comfort', 'SUV', 'Moto'].map((category) => (
        <Card
          key={category}
          style={form.categoria === category ? { borderWidth: 2, borderColor: '#087a50' } : null}
        >
          <Text onPress={() => update('categoria')(category)}>
            {form.categoria === category ? '● ' : '○ '}{category}
          </Text>
        </Card>
      ))}
      <Field placeholder="Placa" value={form.placa} onChangeText={update('placa')} />
      <Field placeholder="Cor" value={form.cor} onChangeText={update('cor')} />
      <Field placeholder="Ano de fabricação" value={form.anoFabricacao} onChangeText={update('anoFabricacao')} keyboardType="number-pad" />
      <Field placeholder="Ano do modelo" value={form.anoModelo} onChangeText={update('anoModelo')} keyboardType="number-pad" />
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={register} disabled={loading}>
        {loading ? 'Cadastrando…' : 'Criar conta de motorista'}
      </Button>
      <Text style={s.muted}>Em modo local de testes, a conta é aprovada automaticamente. Fora dele, depende de aprovação administrativa.</Text>
    </Page>
  );
}
