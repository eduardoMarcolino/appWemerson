import { ThemedText as Text } from '../ui';
import React, { useState } from 'react';

import { api } from '../api';
import { Button, Field, Page, s } from '../ui';
import RideReportForm from '../components/RideReportForm';

export default function RatePassenger({ go, session }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rated, setRated] = useState(false);
  const rideId = session.activeRide?.corrida?.corridaId;

  async function submitRating() {
    setLoading(true);
    setError('');
    try {
      await api.post(`/corridas/${rideId}/avaliacoes`, { nota: rating, comentario: comment.trim() || null });
      setRated(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Avaliar passageiro" go={go} back="FinishRide">
      <Text style={{ fontWeight: '900', fontSize: 17, textAlign: 'center' }}>
        {session.activeRide?.corrida?.beneficiarioNome || 'Passageiro'}
      </Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>
        'A corrida foi concluída. Sua avaliação é opcional e não depende de pagamento.'
      </Text>
      <Text style={s.h2}>Como foi a experiência?</Text>
      <Text style={{ color: '#f2a800', fontSize: 30, textAlign: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} onPress={() => setRating(star)}>{star <= rating ? '★' : '☆'}</Text>
        ))}
      </Text>
      <Field placeholder="Comentário (opcional)" value={comment} onChangeText={setComment} multiline />
      <RideReportForm rideId={rideId} />
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {rated ? <Text style={{ color: '#087a50' }}>Avaliação enviada.</Text> : null}
      <Button onPress={submitRating} disabled={loading || rated || !rideId}>
        {loading ? 'Enviando…' : rated ? 'Avaliação concluída' : 'Enviar avaliação'}
      </Button>
      <Button light onPress={() => go('RideComplete')}>Concluir</Button>
    </Page>
  );
}
