import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Page, s } from '../ui';

export default function RateDriver({ go, session }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const rideId = session.activeRide?.corrida?.corridaId;
  const driverName = session.activeRide?.motorista?.user?.nome || 'Motorista';
  const driverId = session.activeRide?.motorista?.motoristaId;

  async function submitRating() {
    setLoading(true);
    setError('');
    try {
      await api.post(`/corridas/${rideId}/avaliacoes`, { nota: rating, comentario: comment.trim() || null });
      go('Home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function favoriteDriver() {
    setFavoriteLoading(true);
    setError('');
    try {
      await api.post(`/passageiro/motoristas-favoritos/${driverId}`, {});
      go('Home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <Page title="Avaliar motorista" go={go} back="Payment">
      <Card>
        <Text style={{ fontWeight: '700' }}>{driverName}</Text>
        <Text style={s.muted}>Obrigado por compartilhar sua experiência.</Text>
      </Card>
      <Text style={[s.h2, { textAlign: 'center' }]}>Como foi sua viagem?</Text>
      <Text style={{ fontSize: 36, textAlign: 'center', color: '#f4b400' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} onPress={() => setRating(star)}>{star <= rating ? '★' : '☆'}</Text>
        ))}
      </Text>
      <Field
        label="Comentário opcional"
        value={comment}
        onChangeText={setComment}
        placeholder="Conte como foi sua experiência."
        multiline
        maxLength={1000}
      />
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={submitRating} disabled={loading || !rideId}>
        {loading ? 'Enviando…' : 'Enviar avaliação'}
      </Button>
      {driverId ? (
        <Button light onPress={favoriteDriver} disabled={favoriteLoading}>
          {favoriteLoading ? 'Salvando…' : 'Adicionar motorista aos favoritos'}
        </Button>
      ) : null}
      <Pressable onPress={() => go('Home')}><Text style={[s.muted, { textAlign: 'center' }]}>Pular</Text></Pressable>
    </Page>
  );
}
