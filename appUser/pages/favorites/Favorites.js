import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Nav, Page, s } from '../ui';

export default function Favorites({ go }) {
  const [data, setData] = useState({ enderecosFavoritos: [], motoristasFavoritos: [] });
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const { data: appData } = await api.get('/app-data');
      setData(appData);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function saveAddress() {
    setLoading(true);
    setError('');
    try {
      await api.post('/passageiro/enderecos-favoritos', { nome: name.trim(), endereco: address.trim(), tipo: 'Outro' });
      setName('');
      setAddress('');
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeAddress(id) {
    try {
      await api.delete(`/passageiro/enderecos-favoritos/${id}`);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeDriver(id) {
    try {
      await api.delete(`/passageiro/motoristas-favoritos/${id}`);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Page title="Favoritos" go={go}>
        <Text style={s.h2}>Endereços salvos</Text>
        <Field placeholder="Nome (ex.: Casa)" value={name} onChangeText={setName} />
        <Field placeholder="Endereço" value={address} onChangeText={setAddress} />
        <Button onPress={saveAddress} disabled={loading || !name.trim() || !address.trim()}>
          {loading ? 'Salvando…' : 'Salvar endereço'}
        </Button>
        {data.enderecosFavoritos.length === 0 ? <Text style={s.muted}>Você ainda não salvou endereços.</Text> : null}
        {data.enderecosFavoritos.map((item) => (
          <Card key={item.enderecoFavoritoId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{item.nome}</Text>
              <Text style={s.muted}>{item.endereco}</Text>
            </View>
            <Pressable onPress={() => removeAddress(item.enderecoFavoritoId)} hitSlop={10}>
              <Text style={{ color: '#d94b45' }}>Remover</Text>
            </Pressable>
          </Card>
        ))}
        <Text style={s.h2}>Motoristas favoritos</Text>
        {data.motoristasFavoritos.length === 0 ? <Text style={s.muted}>Você ainda não favoritou motoristas.</Text> : null}
        {data.motoristasFavoritos.map((driver) => {
          const vehicle = driver.veiculos?.[0];
          return (
            <Card key={driver.motoristaId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{driver.user?.nome}</Text>
                <Text style={s.muted}>★ {Number(driver.avaliacaoMedia || 0).toFixed(1)}{vehicle ? ` · ${vehicle.marca} ${vehicle.modelo}` : ''}</Text>
              </View>
              <Pressable onPress={() => removeDriver(driver.motoristaId)} hitSlop={10}>
                <Text style={{ color: '#d94b45' }}>Remover</Text>
              </Pressable>
            </Card>
          );
        })}
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      </Page>
      <Nav go={go} />
    </View>
  );
}
