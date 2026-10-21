import { getThemeColors, ThemedText as Text } from '../ui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

const activeStatuses = ['Aceita', 'MotoristaChegando', 'EmAndamento'];
const statusLabels = {
  Aceita: 'Corrida aceita · vá ao embarque',
  MotoristaChegando: 'Marque sua chegada ao embarque',
  EmAndamento: 'Corrida em andamento',
};

export default function ActiveRideSheet({ activeRide, go, locationShareMessage }) {
  const scheme = useColorScheme();
  const theme = getThemeColors(scheme);
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.min(330, Math.max(270, windowHeight * 0.55));
  const collapsedOffset = sheetHeight - 66;
  const ride = activeRide?.corrida;
  const visible = Boolean(ride && activeStatuses.includes(ride.status));
  const [expanded, setExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(collapsedOffset)).current;
  const dragStart = useRef(collapsedOffset);

  useEffect(() => {
    setExpanded(false);
    translateY.setValue(collapsedOffset);
  }, [ride?.corridaId, collapsedOffset, translateY]);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: expanded ? 0 : collapsedOffset,
      useNativeDriver: false,
      tension: 65,
      friction: 12,
    }).start();
  }, [collapsedOffset, expanded, translateY]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderGrant: () => {
      dragStart.current = expanded ? 0 : collapsedOffset;
      translateY.stopAnimation();
    },
    onPanResponderMove: (_event, gesture) => {
      const nextOffset = Math.min(collapsedOffset, Math.max(0, dragStart.current + gesture.dy));
      translateY.setValue(nextOffset);
    },
    onPanResponderRelease: (_event, gesture) => {
      const nextOffset = Math.min(collapsedOffset, Math.max(0, dragStart.current + gesture.dy));
      setExpanded(nextOffset < collapsedOffset / 2);
    },
    onPanResponderTerminate: () => setExpanded(false),
  }), [collapsedOffset, expanded, translateY]);

  if (!visible) return null;

  function openRide() {
    if (ride.status === 'EmAndamento') {
      go('Trip');
    } else if (ride.status === 'MotoristaChegando') {
      go('StartRide');
    } else {
      go('RideAccepted');
    }
  }

  const scheduledAt = activeRide.agendamento?.dataHora;

  return (
    <Animated.View
      accessibilityViewIsModal={false}
      style={[
        styles.sheet,
        {
          height: sheetHeight,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Minimizar corrida ativa' : 'Expandir corrida ativa'}
        onPress={() => setExpanded((current) => !current)}
        style={styles.handleArea}
        {...panResponder.panHandlers}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <View style={styles.summaryRow}>
          <Text numberOfLines={1} style={styles.summaryStatus}>{statusLabels[ride.status] || ride.status}</Text>
          <Text style={[styles.chevron, { color: theme.secondaryText }]}>{expanded ? '⌄' : '⌃'}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.summaryRoute, { color: theme.secondaryText }]}>
          {ride.origem} → {ride.destino}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.details}>
          <Text style={[styles.status, { color: theme.secondaryText }]}>Status: {statusLabels[ride.status] || ride.status}</Text>
          <Text numberOfLines={2} style={styles.location}>Embarque: {ride.origem}</Text>
          <Text numberOfLines={2} style={styles.location}>Destino: {ride.destino}</Text>
          <Text numberOfLines={1} style={styles.location}>Passageiro: {ride.beneficiarioNome || 'Titular da conta'}</Text>
          {scheduledAt ? (
            <Text style={[styles.status, { color: theme.secondaryText }]}>Agendada para {new Date(scheduledAt).toLocaleString('pt-BR')}</Text>
          ) : null}
          {ride.status === 'EmAndamento' && locationShareMessage ? <Text style={[styles.status, { color: theme.secondaryText }]}>{locationShareMessage}</Text> : null}
          <Pressable onPress={openRide} style={styles.openButton}>
            <Text style={styles.openButtonText}>Abrir detalhes e ações da corrida</Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  handleArea: { minHeight: 58 },
  handle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  summaryStatus: { flex: 1, fontSize: 15, fontWeight: '800' },
  chevron: { fontSize: 20, fontWeight: '900' },
  summaryRoute: { fontSize: 12, marginTop: 2 },
  details: { gap: 8, paddingTop: 9 },
  status: { fontSize: 12 },
  location: { fontSize: 13, fontWeight: '700' },
  openButton: { minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#087a50', paddingHorizontal: 12, marginTop: 2 },
  openButtonText: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
