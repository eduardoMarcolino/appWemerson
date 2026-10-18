import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Field } from '../ui';

export default function CepAddressLookup({ cep, onChangeCep, onAddressFound, error, setError }) {
  const [loading, setLoading] = useState(false);

  async function lookup() {
    setError('');
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setError('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error('Não foi possível consultar o CEP. Tente novamente.');
      const address = await response.json();
      if (address.erro) throw new Error('CEP não encontrado.');
      onAddressFound({
        logradouro: address.logradouro || '',
        bairro: address.bairro || '',
        cidade: address.localidade || '',
        estado: address.uf || '',
        cep: digits,
      });
    } catch (requestError) {
      setError(requestError.message || 'Falha ao consultar o CEP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Field
        label="CEP"
        placeholder="00000000"
        value={cep}
        onChangeText={(value) => onChangeCep(value.replace(/\D/g, '').slice(0, 8))}
        keyboardType="number-pad"
      />
      <Button onPress={lookup} disabled={loading}>
        {loading ? 'Consultando CEP…' : 'Buscar endereço pelo CEP'}
      </Button>
      <Text style={{ color: '#6f7c76', fontSize: 12 }}>
        O endereço será preenchido automaticamente pela API ViaCEP.
      </Text>
    </View>
  );
}
