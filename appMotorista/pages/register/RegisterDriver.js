import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { api, persistSession } from '../api';
import { Button, Card, Field, Page, s } from '../ui';
import CepAddressLookup from '../components/CepAddressLookup';
import { isValidCpf, isValidCnh } from '../utils/documentValidation';

const initialForm = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  numeroTelefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  cnh: '',
  validadeCNH: '',
  marca: '',
  modelo: '',
  placa: '',
  cor: '',
  anoFabricacao: '',
  anoModelo: '',
  categoria: '',
};

export default function RegisterDriver({ go, setSession }) {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibilidade, setVisibilidade] = useState(true);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    api.get('/catalogos')
      .then(({ data }) => {
        setCategories(data.categorias);
        setForm((current) => ({
          ...current,
          categoria: current.categoria || data.categorias[0]?.value || '',
        }));
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCatalogLoading(false));
  }, []);

  async function register() {
    setError('');
    if (!isValidCpf(form.cpf)) {
      setError('CPF inválido. Confira os 11 dígitos.');
      return;
    }
    if (!isValidCnh(form.cnh)) {
      setError('CNH inválida. Confira os 11 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        cnh: form.cnh.replace(/\D/g, ''),
        numeroTelefone: form.numeroTelefone.replace(/\D/g, ''),
        anoFabricacao: form.anoFabricacao ? Number(form.anoFabricacao) : null,
        anoModelo: form.anoModelo ? Number(form.anoModelo) : null,
      };
      const { data } = await api.post('/motorista/insert', payload);
      const nextSession = { user: data.user, motorista: data.motorista, activeRide: null };
      await persistSession(data.token, nextSession, false, data.expires_at);
      setSession(nextSession);
      go('Home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Cadastro de motorista" go={go} back="Login" showMenu={false}>
      <Text style={s.h2}>Dados pessoais</Text>
      <Field label="Nome completo" placeholder="Digite seu nome" value={form.nome} onChangeText={update('nome')} />
      <Field label="E-mail" placeholder="voce@exemplo.com" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
      <Field label="Senha" placeholder="Mínimo 6 caracteres" value={form.senha} onChangeText={update('senha')} secureTextEntry={visibilidade} />
      <Pressable onPress={() => setVisibilidade(!visibilidade)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={s.muted}>Mostrar senha</Text>
      </Pressable>
      <Field label="CPF" placeholder="11 dígitos" value={form.cpf} onChangeText={update('cpf')} keyboardType="number-pad" />
      <Field label="Telefone com DDD" placeholder="(00) 00000-0000" value={form.numeroTelefone} onChangeText={update('numeroTelefone')} keyboardType="phone-pad" />
      <CepAddressLookup
        cep={form.cep}
        onChangeCep={update('cep')}
        setError={setError}
        onAddressFound={(address) => setForm((current) => ({ ...current, ...address }))}
      />
      <Field label="Logradouro" placeholder="Rua ou avenida" value={form.logradouro} onChangeText={update('logradouro')} />
      <Field label="Número" placeholder="Número do imóvel" value={form.numero} onChangeText={update('numero')} />
      <Field label="Complemento" placeholder="Opcional" value={form.complemento} onChangeText={update('complemento')} />
      <Field label="Bairro" placeholder="Bairro" value={form.bairro} onChangeText={update('bairro')} />
      <Field label="Cidade" placeholder="Cidade" value={form.cidade} onChangeText={update('cidade')} />
      <Field label="Estado (UF)" placeholder="Ex.: SP" value={form.estado} onChangeText={update('estado')} />
      <Text style={s.h2}>CNH e veículo</Text>
      <Field label="Número da CNH (11 dígitos)" placeholder="Somente números" value={form.cnh} onChangeText={(value) => update('cnh')(value.replace(/\D/g, '').slice(0, 11))} keyboardType="number-pad" />
      <Field label="Validade da CNH" placeholder="AAAA-MM-DD" value={form.validadeCNH} onChangeText={update('validadeCNH')} />
      <Field label="Marca do veículo" placeholder="Marca" value={form.marca} onChangeText={update('marca')} />
      <Field label="Modelo do veículo" placeholder="Modelo" value={form.modelo} onChangeText={update('modelo')} />
      <Text style={s.h2}>Categoria do veículo</Text>
      {catalogLoading ? <Text style={s.muted}>Carregando categorias…</Text> : null}
      {categories.map(({ value, label, icon }) => (
        <Card
          key={value}
          style={form.categoria === value ? { borderWidth: 2, borderColor: '#087a50' } : null}
        >
          <Text onPress={() => update('categoria')(value)}>
            {form.categoria === value ? '● ' : '○ '}{icon} {label}
          </Text>
        </Card>
      ))}
      {!catalogLoading && categories.length === 0 && !error
        ? <Text style={s.muted}>Nenhuma categoria está disponível.</Text>
        : null}
      <Field label="Placa" placeholder="ABC1D23" value={form.placa} onChangeText={update('placa')} />
      <Field label="Cor" placeholder="Cor do veículo" value={form.cor} onChangeText={update('cor')} />
      <Field label="Ano de fabricação" placeholder="AAAA" value={form.anoFabricacao} onChangeText={update('anoFabricacao')} keyboardType="number-pad" />
      <Field label="Ano do modelo" placeholder="AAAA" value={form.anoModelo} onChangeText={update('anoModelo')} keyboardType="number-pad" />
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={register} disabled={loading || catalogLoading || !form.categoria}>
        {loading ? 'Cadastrando…' : catalogLoading ? 'Carregando…' : 'Criar conta de motorista'}
      </Button>
      <Text style={s.muted}>Seu cadastro ficará pendente até um administrador conferir sua CNH e os documentos do veículo. Você poderá entrar no app, mas só receberá corridas depois da aprovação.</Text>
    </Page>
  );
}
