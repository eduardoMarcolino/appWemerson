import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Button, Field, Page, s } from '../ui';
import { api } from '../api';
import CepAddressLookup from '../components/CepAddressLookup';
import { isValidCpf } from '../utils/documentValidation';

export default function Register({ go }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [visibilidade, setVisibilidade] = useState(true);

  async function cadastrar() {
    setErro('');
    if (nome.trim().length < 3) return setErro('Informe seu nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('E-mail inválido.');
    if (telefone.replace(/\D/g, '').length < 10) return setErro('Telefone inválido.');
    if (!isValidCpf(cpf)) return setErro('CPF inválido. Confira os 11 dígitos.');
    if (senha.length < 6) return setErro('Senha deve ter pelo menos 6 caracteres.');
    if (senha !== senha2) return setErro('As senhas não coincidem.');
    if (!logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim() || !cep.trim())
      return setErro('Preencha todos os campos de endereço.');

    setLoading(true);
    try {
      const { data, status } = await api.post('/passageiro/insert', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        cpf: cpf.replace(/\D/g, ''),
        senha,
        fotoPerfil: '',
        numeroTelefone: telefone.replace(/\D/g, ''),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        cep: cep.replace(/\D/g, ''),
      });
      if (status === 201) {
        alert('Conta criada! Agora faça login.');
        go('Login');
      } else {
        setErro(data?.message || 'Erro ao cadastrar. Tente novamente.');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Criar conta" go={go} back="Login">
      <Text style={s.muted}>Vamos criar sua conta</Text>

      <Field label="Nome completo" placeholder="Digite seu nome" value={nome} onChangeText={setNome} />
      <Field label="E-mail" placeholder="voce@exemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Telefone com DDD" placeholder="(00) 00000-0000" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Field label="CPF" placeholder="Somente números" value={cpf} onChangeText={setCpf} keyboardType="number-pad" />
      <Field label="Senha" placeholder="Mínimo 6 caracteres" secureTextEntry={visibilidade} value={senha} onChangeText={setSenha} />
      <Field label="Confirmar senha" placeholder="Digite a senha novamente" secureTextEntry={visibilidade} value={senha2} onChangeText={setSenha2} />
      <Pressable onPress={() => setVisibilidade(!visibilidade)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={s.muted}>Mostrar senha</Text>
      </Pressable>

      <Text style={s.h2}>Endereço</Text>
      <CepAddressLookup
        cep={cep}
        onChangeCep={setCep}
        setError={setErro}
        onAddressFound={(address) => {
          setLogradouro(address.logradouro);
          setBairro(address.bairro);
          setCidade(address.cidade);
          setEstado(address.estado);
          setCep(address.cep);
        }}
      />
      <Field label="Logradouro" placeholder="Rua ou avenida" value={logradouro} onChangeText={setLogradouro} />
      <Field label="Número" placeholder="Número do imóvel" value={numero} onChangeText={setNumero} />
      <Field label="Complemento" placeholder="Opcional" value={complemento} onChangeText={setComplemento} />
      <Field label="Bairro" placeholder="Bairro" value={bairro} onChangeText={setBairro} />
      <Field label="Cidade" placeholder="Cidade" value={cidade} onChangeText={setCidade} />
      <Field label="Estado (UF)" placeholder="Ex.: SP" value={estado} onChangeText={setEstado} />

      {erro ? <Text style={[s.muted, { color: '#d94b45', textAlign: 'center' }]}>{erro}</Text> : null}

      <Button onPress={cadastrar} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Criar conta'}
      </Button>
      <Text style={[s.muted, { textAlign: 'center' }]}>Já tem conta? Entre</Text>
    </Page>
  );
}
