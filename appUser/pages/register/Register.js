import React, { useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Button, Field, Page, s } from '../ui';
import { api } from '../api';

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

  async function cadastrar() {
    setErro('');
    if (nome.trim().length < 3) return setErro('Informe seu nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('E-mail inválido.');
    if (telefone.replace(/\D/g, '').length < 10) return setErro('Telefone inválido.');
    if (cpf.replace(/\D/g, '').length !== 11) return setErro('CPF deve ter 11 dígitos.');
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
        numeroTelefone: telefone,
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

      <Field placeholder="Nome completo" value={nome} onChangeText={setNome} />
      <Field placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field placeholder="Telefone (com DDD)" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Field placeholder="CPF (somente números)" value={cpf} onChangeText={setCpf} keyboardType="number-pad" />
      <Field placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <Field placeholder="Confirmar senha" secureTextEntry value={senha2} onChangeText={setSenha2} />

      <Text style={s.h2}>Endereço</Text>
      <Field placeholder="Logradouro (rua/avenida)" value={logradouro} onChangeText={setLogradouro} />
      <Field placeholder="Número" value={numero} onChangeText={setNumero} />
      <Field placeholder="Complemento (opcional)" value={complemento} onChangeText={setComplemento} />
      <Field placeholder="Bairro" value={bairro} onChangeText={setBairro} />
      <Field placeholder="Cidade" value={cidade} onChangeText={setCidade} />
      <Field placeholder="Estado (UF)" value={estado} onChangeText={setEstado} />
      <Field placeholder="CEP (somente números)" value={cep} onChangeText={setCep} keyboardType="number-pad" />

      {erro ? <Text style={[s.muted, { color: '#d94b45', textAlign: 'center' }]}>{erro}</Text> : null}

      <Button onPress={cadastrar} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Criar conta'}
      </Button>
      <Text style={[s.muted, { textAlign: 'center' }]}>Já tem conta? Entre</Text>
    </Page>
  );
}
