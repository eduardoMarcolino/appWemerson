import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Page, s } from '../ui';
import MapPicker from '../components/MapPicker';
import CepAddressLookup from '../components/CepAddressLookup';

export default function MeetingPoint({ go, session, updateDraft }) {
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [cepAddress, setCepAddress] = useState(null);
  const [points, setPoints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/app-data')
      .then(({ data }) => setPoints([...data.pontosEmbarque, ...data.pontosEncontro]))
      .catch((requestError) => setError(requestError.message));
  }, []);

  function addressLabel(address = cepAddress, houseNumber = number) {
    if (!address) return '';
    const street = [address.logradouro, houseNumber].filter(Boolean).join(', ');
    return [street, address.bairro, [address.cidade, address.estado].filter(Boolean).join('/')].filter(Boolean).join(' · ');
  }

  return (
    <Page title="Ponto de embarque" go={go} back="Schedule">
      <Text style={s.muted}>Selecione um ponto sugerido, pesquise um CEP ou escolha o local no mapa.</Text>
      <CepAddressLookup
        cep={cep}
        onChangeCep={(value) => {
          setCep(value);
          setCepAddress(null);
          setNumber('');
          updateDraft({ origem: '', latitudeOrigem: null, longitudeOrigem: null });
        }}
        setError={setError}
        onAddressFound={(address) => {
          setCepAddress(address);
          updateDraft({ origem: addressLabel(address), latitudeOrigem: null, longitudeOrigem: null });
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
              updateDraft({ origem: addressLabel(cepAddress, value), latitudeOrigem: null, longitudeOrigem: null });
            }}
          />
          <Text style={s.muted}>Endereço encontrado: {addressLabel()}</Text>
          <Text style={s.muted}>Marque o endereço no mapa para definir as coordenadas da corrida.</Text>
        </>
      ) : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <MapPicker
        value={session.tripDraft.latitudeOrigem !== null && session.tripDraft.longitudeOrigem !== null
          ? { latitude: session.tripDraft.latitudeOrigem, longitude: session.tripDraft.longitudeOrigem }
          : null}
        onChange={(coordinate) => updateDraft({
          origem: cepAddress ? addressLabel() : 'Ponto selecionado no mapa',
          latitudeOrigem: coordinate.latitude,
          longitudeOrigem: coordinate.longitude,
        })}
      />
      {points.map((point) => (
        <Pressable key={point.pontoInteresseId || `saved-${point.pontoEncontroId}`} onPress={() => {
          setCepAddress(null);
          setCep('');
          setNumber('');
          updateDraft({
            origem: point.nome,
            latitudeOrigem: Number(point.latitude),
            longitudeOrigem: Number(point.longitude),
          });
        }}>
          <Card style={session.tripDraft.origem === point.nome ? { borderColor: '#087a50', borderWidth: 2 } : null}>
            <Text style={{ fontWeight: '700' }}>📍 {point.nome}</Text>
          </Card>
        </Pressable>
      ))}
      {points.length === 0 && !error ? <Text style={s.muted}>Ainda não há pontos de embarque cadastrados. Escolha diretamente no mapa.</Text> : null}
      <Button onPress={() => go('Beneficiary')} disabled={!session.tripDraft.origem || session.tripDraft.latitudeOrigem === null}>Confirmar ponto de embarque</Button>
    </Page>
  );
}
