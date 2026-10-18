import { ThemedText as Text } from '../ui';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Button, Card, Field, s } from '../ui';

export default function AddressSearch({ query, onQueryChange, onSelect, setError, label }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const lastSearchAt = useRef(0);

  function updateQuery(value) {
    onQueryChange(value);
    setResults([]);
    setSearched(false);
    setError('');
  }

  async function search() {
    const searchText = query.trim();
    setError('');
    setResults([]);
    setSearched(false);
    if (searchText.length < 3) {
      setError('Digite pelo menos 3 caracteres para pesquisar o endereço.');
      return;
    }
    if (Date.now() - lastSearchAt.current < 1000) {
      setError('Aguarde um instante antes de pesquisar novamente.');
      return;
    }

    lastSearchAt.current = Date.now();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchText,
        format: 'jsonv2',
        addressdetails: '1',
        countrycodes: 'br',
        limit: '6',
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR',
          ...(Platform.OS === 'web'
            ? {}
            : { 'User-Agent': 'InteriorGo/1.0 (https://github.com/EspectrumOrg/appWemerson)' }),
        },
      }).finally(() => clearTimeout(timeout));
      if (!response.ok) throw new Error('Não foi possível pesquisar endereços agora. Tente novamente.');
      const places = await response.json();
      const matches = places
        .filter((place) => Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon)))
        .map((place) => ({
          label: place.display_name,
          latitude: Number(place.lat),
          longitude: Number(place.lon),
        }));
      setResults(matches);
      setSearched(true);
    } catch {
      setError('Não foi possível pesquisar o endereço agora. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function selectAddress(place) {
    setResults([]);
    setSearched(false);
    onQueryChange(place.label);
    onSelect(place);
  }

  return (
    <View style={{ gap: 8 }}>
      <Field
        label={label}
        placeholder="Rua, número, bairro ou cidade"
        value={query}
        onChangeText={updateQuery}
        onSubmitEditing={search}
        returnKeyType="search"
      />
      <Button light onPress={search} disabled={loading}>
        {loading ? 'Pesquisando endereços…' : 'Pesquisar endereço'}
      </Button>
      {searched && results.length === 0 && !loading
        ? <Text style={s.muted}>Nenhum resultado de endereço para essa pesquisa.</Text>
        : null}
      {results.map((place) => (
        <Pressable key={`${place.latitude}:${place.longitude}`} onPress={() => selectAddress(place)}>
          <Card>
            <Text style={s.muted}>{place.label}</Text>
          </Card>
        </Pressable>
      ))}
      <Text style={s.muted}>Endereços fornecidos por © OpenStreetMap contributors.</Text>
    </View>
  );
}
