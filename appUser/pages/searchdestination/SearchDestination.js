import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Page, s } from '../ui';
import MapPicker from '../components/MapPicker';
import CepAddressLookup from '../components/CepAddressLookup';

export default function SearchDestination({ go, session, updateDraft }) {
  const [query, setQuery] = useState('');
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [cepAddress, setCepAddress] = useState(null);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/app-data')
      .then(({ data }) => setPlaces(data.pontosInteresse))
      .catch((requestError) => setError(requestError.message));
  }, []);
  const suggestions = places.filter((place) => place.nome.toLowerCase().includes(query.toLowerCase()));

  function addressLabel(address = cepAddress, houseNumber = number) {
    if (!address) return '';
    const street = [address.logradouro, houseNumber].filter(Boolean).join(', ');
    return [street, address.bairro, [address.cidade, address.estado].filter(Boolean).join('/')].filter(Boolean).join(' · ');
  }

  return (
    <Page title="Para onde vamos?" go={go}>
      <Field label="Pesquisar locais sugeridos" placeholder="Digite o nome do local" value={query} onChangeText={setQuery} />
      <Text style={s.h2}>Ou informe o CEP do destino</Text>
      <CepAddressLookup
        cep={cep}
        onChangeCep={(value) => {
          setCep(value);
          setCepAddress(null);
          setNumber('');
          updateDraft({ destino: '', latitudeDestino: null, longitudeDestino: null });
        }}
        setError={setError}
        onAddressFound={(address) => {
          setCepAddress(address);
          updateDraft({ destino: addressLabel(address), latitudeDestino: null, longitudeDestino: null });
        }}
      />
      {cepAddress ? (
        <>
          <Field
            label="Número do imóvel"
            placeholder="Número"
            value={number}
            onChangeText={(value) => {
              setNumber(value);
              updateDraft({ destino: addressLabel(cepAddress, value), latitudeDestino: null, longitudeDestino: null });
            }}
          />
          <Text style={s.muted}>Endereço encontrado: {addressLabel()}</Text>
          <Text style={s.muted}>Marque o endereço no mapa para definir as coordenadas da corrida.</Text>
        </>
      ) : null}
      <Text style={s.h2}>Sugestões</Text>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {suggestions.length === 0 && !error ? <Text style={s.muted}>Nenhum destino cadastrado corresponde à pesquisa.</Text> : null}
      {suggestions.map((place) => (
        <Pressable key={place.pontoInteresseId} onPress={() => {
          setCepAddress(null);
          setCep('');
          setNumber('');
          updateDraft({
            destino: place.nome,
            latitudeDestino: Number(place.latitude),
            longitudeDestino: Number(place.longitude),
          });
        }}>
          <Card style={session.tripDraft.destino === place.nome ? { borderColor: '#087a50', borderWidth: 2 } : null}>
            <Text style={{ fontWeight: '700' }}>📍 {place.nome}</Text>
            <Text style={s.muted}>{place.descricao || place.logradouro || 'Toque para selecionar como destino'}</Text>
          </Card>
        </Pressable>
      ))}
      <MapPicker
        value={session.tripDraft.latitudeDestino !== null && session.tripDraft.longitudeDestino !== null
          ? { latitude: session.tripDraft.latitudeDestino, longitude: session.tripDraft.longitudeDestino }
          : null}
        onChange={(coordinate) => updateDraft({
          destino: cepAddress ? addressLabel() : 'Ponto selecionado no mapa',
          latitudeDestino: coordinate.latitude,
          longitudeDestino: coordinate.longitude,
        })}
      />
      <Button onPress={() => go('Schedule')} disabled={!session.tripDraft.destino}>
        Continuar
      </Button>
    </Page>
  );
}
