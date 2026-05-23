// src/screens/ScheduleScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../utils/theme';
import { format } from 'date-fns';

export default function ScheduleScreen() {
  const [selected, setSelected]     = useState('');
  const [markedDates, setMarked]    = useState({});
  const [note, setNote]             = useState('');
  const [schedules, setSchedules]   = useState([]);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    try {
      const res = await ScheduleAPI.mySchedule();
      setSchedules(res.data);
      const marks = {};
      res.data.forEach(s => {
        marks[s.date] = {
          marked: true,
          dotColor: s.unavailable ? Colors.danger : Colors.success,
          selectedColor: Colors.accent,
        };
      });
      setMarked(marks);
    } catch (_) {}
  };

  useEffect(() => { load(); }, []);

  const handleDateSelect = (day) => {
    setSelected(day.dateString);
    const existing = schedules.find(s => s.date === day.dateString);
    setNote(existing?.note || '');
  };

  const handleSave = async (unavailable) => {
    if (!selected) { Alert.alert('Select a date first'); return; }
    setSaving(true);
    try {
      await ScheduleAPI.set({ date: selected, unavailable, note });
      await load();
      Alert.alert('Saved', `Marked as ${unavailable ? 'unavailable' : 'available'} on ${selected}`);
    } catch (_) {
      Alert.alert('Error', 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await ScheduleAPI.delete(selected);
      await load();
    } catch (_) {}
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedEntry = schedules.find(s => s.date === selected);

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Availability Calendar</Text>
        <Text style={styles.pageSub}>Mark dates when you're unavailable to handle gate</Text>

        <Animatable.View animation="fadeInUp" style={styles.calCard}>
          <Calendar
            current={today}
            onDayPress={handleDateSelect}
            markedDates={{
              ...markedDates,
              ...(selected ? {
                [selected]: {
                  ...(markedDates[selected] || {}),
                  selected: true,
                  selectedColor: Colors.accent,
                }
              } : {}),
            }}
            theme={{
              backgroundColor:           Colors.cardBg,
              calendarBackground:        Colors.cardBg,
              textSectionTitleColor:     Colors.gray400,
              selectedDayBackgroundColor: Colors.accent,
              selectedDayTextColor:      Colors.primary,
              todayTextColor:            Colors.accent,
              dayTextColor:              Colors.white,
              textDisabledColor:         Colors.gray600,
              dotColor:                  Colors.accent,
              monthTextColor:            Colors.white,
              arrowColor:                Colors.accent,
              'stylesheet.calendar.header': {
                week: { marginTop: 5, flexDirection: 'row', justifyContent: 'space-between' }
              },
            }}
            style={styles.calendar}
          />
        </Animatable.View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.danger }]} /><Text style={styles.legendText}>Unavailable</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Available</Text></View>
        </View>

        {/* Selected date actions */}
        {selected && (
          <Animatable.View animation="fadeInUp" style={styles.actionCard}>
            <Text style={styles.selectedDate}>{selected}</Text>
            {selectedEntry && (
              <View style={[styles.statusBadge, { backgroundColor: selectedEntry.unavailable ? Colors.danger + '22' : Colors.success + '22' }]}>
                <Text style={{ color: selectedEntry.unavailable ? Colors.danger : Colors.success, fontSize: Fonts.sizes.sm, fontWeight: '600' }}>
                  {selectedEntry.unavailable ? '🔴 Unavailable' : '🟢 Available'}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.noteInput}
              placeholder="Optional note (e.g. travelling, busy)"
              placeholderTextColor={Colors.gray400}
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.unavailBtn]} onPress={() => handleSave(true)} disabled={saving}>
                <Ionicons name="close-circle" size={16} color={Colors.white} />
                <Text style={styles.actionBtnText}>Mark Unavailable</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.availBtn]} onPress={() => handleSave(false)} disabled={saving}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={styles.actionBtnText}>Mark Available</Text>
              </TouchableOpacity>
            </View>

            {selectedEntry && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={styles.deleteText}>Remove Entry</Text>
              </TouchableOpacity>
            )}
          </Animatable.View>
        )}

        {/* Upcoming unavailable */}
        {schedules.filter(s => s.unavailable && s.date >= today).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Unavailability</Text>
            {schedules.filter(s => s.unavailable && s.date >= today).map(s => (
              <View key={s.id} style={styles.upcomingItem}>
                <Ionicons name="calendar" size={16} color={Colors.danger} />
                <View>
                  <Text style={styles.upcomingDate}>{s.date}</Text>
                  {s.note && <Text style={styles.upcomingNote}>{s.note}</Text>}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:     { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100 },
  pageTitle:  { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  pageSub:    { fontSize: Fonts.sizes.sm, color: Colors.gray400, marginBottom: Spacing.lg, marginTop: 4 },
  calCard:    { backgroundColor: Colors.cardBg, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,200,220,0.15)' },
  calendar:   { borderRadius: Radius.xl },
  legend:     { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Fonts.sizes.sm, color: Colors.gray400 },
  actionCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.2)',
  },
  selectedDate: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white, marginBottom: 8 },
  statusBadge:  { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, marginBottom: 12 },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.2)',
    height: 44, paddingHorizontal: Spacing.md, color: Colors.white,
    fontSize: Fonts.sizes.sm, marginBottom: Spacing.md,
  },
  btnRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: 8 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.full },
  unavailBtn: { backgroundColor: Colors.danger },
  availBtn:   { backgroundColor: Colors.success },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
  deleteBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 4 },
  deleteText: { color: Colors.danger, fontSize: Fonts.sizes.sm },
  sectionTitle:  { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, marginBottom: Spacing.md },
  upcomingItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.cardBg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  upcomingDate: { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: '600' },
  upcomingNote: { fontSize: Fonts.sizes.xs, color: Colors.gray400, marginTop: 2 },
});
