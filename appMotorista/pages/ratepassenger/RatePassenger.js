import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { Button, Field, Page, s } from '../ui';

export default function RatePassenger({ go, session, setSession }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const rideId = session.activeRide?.corrida?.corridaId;
  const paid = session.activeRide?.pagamento?.statusPagamento === 'Pago';

  useEffect(() => {
    if (!rideId || paid) return undefined;
    let active = true;
    async function refreshPayment() {
      try {
        const { data } = await api.get(`/corridas/${rideId}`);
        if (active) {
          setSession((current) => ({ ...current, activeRide: data }));
          setError('');
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }
    refreshPayment();
    const timer = setInterval(refreshPayment, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [paid, rideId, setSession]);

  async function submitRating() {
    setLoading(true);
    setError('');
    try {
      await api.post(`/corridas/${rideId}/avaliacoes`, { nota: rating, comentario: comment.trim() || null });
      go('RideComplete');
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
        {paid ? 'Pagamento confirmado.' : 'Aguardando o passageiro confirmar o pagamento.'}
      </Text>
      <Text style={s.h2}>Como foi a experiência?</Text>
      <Text style={{ color: '#f2a800', fontSize: 30, textAlign: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} onPress={() => setRating(star)}>{star <= rating ? '★' : '☆'}</Text>
        ))}
      </Text>
      <Field placeholder="Comentário (opcional)" value={comment} onChangeText={setComment} multiline />
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button onPress={submitRating} disabled={loading || !paid || !rideId}>
        {loading ? 'Enviando…' : 'Enviar avaliação'}
      </Button>
      <Button light onPress={() => go('RideComplete')}>Pular avaliação</Button>
    </Page>
  );
}
