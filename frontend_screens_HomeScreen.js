// src/screens/HomeScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveAlert, setEvents, prependEvent } from '../store';
import { GateAPI } from '../services/api';
import { WS_URL } from '../services/api';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../utils/theme';

export default function HomeScreen() {
  const dispatch     = useDispatch();
  const user         = useSelector(s => s.auth.user);
  const events       = useSelector(s => s.alert.events);
  const [refresh, setRefresh] = useState(false);
  const ws           = useRef(null);

  const loadEvents = async () => {
    try {
      const res = await GateAPI.getEvents();
      dispatch(setEvents(res.data));
    } catch (_) {}
  };

  // WebSocket connection for live gate alerts
  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);
      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'GATE_ALERT') {
          dispatch(setActiveAlert(data));
          dispatch(prependEvent({
            id: data.event_id,
            message: data.message,
            triggered_by: data.triggered_by,
            created_at: data.timestamp,
            acknowledged: false,
          }));
        }
      };
      ws.current.onerror = () => setTimeout(connect, 3000);
      ws.current.onclose = () => setTimeout(connect, 3000);

      // Heartbeat
      const hb = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) ws.current.send('ping');
      }, 30000);
      return () => clearInterval(hb);
    };
    connect();
    return () => ws.current?.close();
  }, []);

  useEffect(() => { loadEvents(); }, []);

  const onRefresh = async () => { setRefresh(true); await loadEvents(); setRefresh(false); };

  const triggerGate = () => {
    Alert.alert('Trigger Gate Alert', 'Send a test gate alert to all family members?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        try { await GateAPI.trigger({ message: 'Someone is at the gate!' }); }
        catch (_) { Alert.alert('Error', 'Failed to send alert'); }
      }},
    ]);
  };

  const statusColor = (ack) => ack ? Colors.success : Colors.warning;

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subGreeting}>Gate Alert is active</Text>
          </View>
          <View style={styles.statusDot} />
        </Animatable.View>

        {/* Status card */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.statusCard}>
          <LinearGradient colors={[Colors.accent + '33', Colors.cardBg]} style={styles.statusGrad}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.accent} />
            <Text style={styles.statusTitle}>System Online</Text>
            <Text style={styles.statusSub}>Monitoring your gate 24/7</Text>
          </LinearGradient>
        </Animatable.View>

        {/* Quick action */}
        {(user?.role === 'super_admin' || user?.role === 'family_admin') && (
          <Animatable.View animation="fadeInUp" delay={350}>
            <TouchableOpacity style={styles.triggerBtn} onPress={triggerGate} activeOpacity={0.85}>
              <Ionicons name="notifications" size={22} color={Colors.primary} />
              <Text style={styles.triggerText}>Send Gate Alert</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        {/* Recent events */}
        <Animatable.View animation="fadeInUp" delay={450}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {events.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={32} color={Colors.gray400} />
              <Text style={styles.emptyText}>No events yet</Text>
            </View>
          )}
          {events.slice(0, 10).map((ev, i) => (
            <Animatable.View key={ev.id} animation="fadeInUp" delay={i * 60} style={styles.eventCard}>
              <View style={[styles.eventDot, { backgroundColor: statusColor(ev.acknowledged) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventMsg}>{ev.message}</Text>
                <Text style={styles.eventMeta}>
                  {ev.triggered_by} · {new Date(ev.created_at).toLocaleTimeString()}
                </Text>
              </View>
              <View style={[styles.eventBadge, { backgroundColor: ev.acknowledged ? Colors.success + '22' : Colors.warning + '22' }]}>
                <Text style={[styles.eventBadgeText, { color: statusColor(ev.acknowledged) }]}>
                  {ev.acknowledged ? 'Handled' : 'Pending'}
                </Text>
              </View>
            </Animatable.View>
          ))}
        </Animatable.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:      { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting:    { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.white },
  subGreeting: { fontSize: Fonts.sizes.sm, color: Colors.gray400, marginTop: 2 },
  statusDot:   { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, ...Shadow.small },
  statusCard:  { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.lg, ...Shadow.medium },
  statusGrad:  { padding: Spacing.xl, alignItems: 'center', gap: 8 },
  statusTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white },
  statusSub:   { fontSize: Fonts.sizes.sm, color: Colors.gray400 },
  triggerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    justifyContent: 'center', marginBottom: Spacing.lg, ...Shadow.small,
  },
  triggerText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.md },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.white, marginBottom: Spacing.md },
  emptyCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: 8,
  },
  emptyText: { color: Colors.gray400, fontSize: Fonts.sizes.sm },
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardBg, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.1)',
  },
  eventDot:       { width: 8, height: 8, borderRadius: 4 },
  eventMsg:       { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: '600' },
  eventMeta:      { fontSize: Fonts.sizes.xs, color: Colors.gray400, marginTop: 2 },
  eventBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  eventBadgeText: { fontSize: Fonts.sizes.xs, fontWeight: '600' },
});
