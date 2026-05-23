// src/screens/FamilyAdminScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, RefreshControl, Modal, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { AdminAPI, DeviceAPI, ScheduleAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../utils/theme';

const ADMIN_PIN = '1234';

export default function FamilyAdminScreen() {
  const user = useSelector(s => s.auth.user);
  const [unlocked, setUnlocked]       = useState(false);
  const [pin, setPin]                 = useState('');
  const [pinError, setPinError]       = useState(false);
  const [members, setMembers]         = useState([]);
  const [devices, setDevices]         = useState([]);
  const [familySchedule, setFamSched] = useState([]);
  const [refreshing, setRefreshing]   = useState(false);
  const [tab, setTab]                 = useState('members'); // members | devices | schedule

  const load = async () => {
    try {
      const [m, d, s] = await Promise.all([
        AdminAPI.getUsers(),
        DeviceAPI.familyDevices(),
        ScheduleAPI.familySchedule(),
      ]);
      setMembers(m.data);
      setDevices(d.data);
      setFamSched(s.data);
    } catch (_) {}
  };

  useEffect(() => { if (unlocked) load(); }, [unlocked]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRemoveMember = (id, name) => {
    Alert.alert('Remove Member', `Remove ${name} from your family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await AdminAPI.removeUser(id); await load(); }
        catch (_) { Alert.alert('Error', 'Failed to remove member'); }
      }},
    ]);
  };

  const handleRemoveDevice = (id) => {
    Alert.alert('Remove Device', 'Remove this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await DeviceAPI.remove(id); await load(); }
        catch (_) {}
      }},
    ]);
  };

  // ── PIN lock ──────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <LinearGradient colors={[Colors.primary, '#0F2240']} style={styles.lockScreen}>
        <Animatable.View animation="fadeIn" style={styles.lockCard}>
          <Ionicons name="people" size={44} color={Colors.accent} />
          <Text style={styles.lockTitle}>Family Admin</Text>
          <Text style={styles.lockSub}>Enter PIN to access dashboard</Text>
          <View style={styles.pinRow}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
            ))}
          </View>
          {pinError && <Text style={styles.pinError}>Incorrect PIN</Text>}
          <View style={styles.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.numKey, !k && styles.numKeyEmpty]}
                onPress={() => {
                  if (!k) return;
                  if (k === '⌫') { setPin(p => p.slice(0, -1)); setPinError(false); return; }
                  if (pin.length < 4) {
                    const np = pin + k;
                    setPin(np);
                    if (np.length === 4) {
                      setTimeout(() => {
                        if (np === ADMIN_PIN) { setUnlocked(true); setPinError(false); }
                        else { setPinError(true); setPin(''); }
                      }, 100);
                    }
                  }
                }}
              >
                {k ? <Text style={styles.numKeyText}>{k}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
      </LinearGradient>
    );
  }

  const TABS = ['members', 'devices', 'schedule'];
  const TAB_ICONS = { members: 'people', devices: 'phone-portrait', schedule: 'calendar' };

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Family Dashboard</Text>
        <Text style={styles.pageSub}>Managing your family network</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Ionicons name={TAB_ICONS[t]} size={15} color={tab === t ? Colors.primary : Colors.gray400} />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            </View>
            {members.length === 0 && <Text style={styles.emptyText}>No members yet</Text>}
            {members.map((m, i) => (
              <Animatable.View key={m.id} animation="fadeInUp" delay={i * 50} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <View style={[styles.rolePill, { backgroundColor: m.role === 'family_admin' ? Colors.accent + '22' : Colors.gray600 + '33' }]}>
                    <Text style={[styles.roleText, { color: m.role === 'family_admin' ? Colors.accent : Colors.gray400 }]}>
                      {m.role === 'family_admin' ? 'Admin' : 'Member'}
                    </Text>
                  </View>
                </View>
                {m.role !== 'family_admin' && m.role !== 'super_admin' && (
                  <TouchableOpacity onPress={() => handleRemoveMember(m.id, m.name)} style={styles.removeBtn}>
                    <Ionicons name="person-remove-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </Animatable.View>
            ))}
          </>
        )}

        {/* DEVICES TAB */}
        {tab === 'devices' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Devices ({devices.length})</Text>
            </View>
            {devices.length === 0 && <Text style={styles.emptyText}>No devices registered</Text>}
            {devices.map((d, i) => (
              <Animatable.View key={d.id} animation="fadeInUp" delay={i * 50} style={styles.deviceCard}>
                <Ionicons
                  name={d.platform === 'ios' ? 'logo-apple' : 'logo-android'}
                  size={28}
                  color={d.platform === 'ios' ? Colors.white : Colors.success}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceName}>{d.name || 'Unnamed Device'}</Text>
                  <Text style={styles.deviceMeta}>
                    {d.platform.toUpperCase()} · Registered {new Date(d.registered_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.activeDot, { backgroundColor: d.is_active ? Colors.success : Colors.danger }]} />
                <TouchableOpacity onPress={() => handleRemoveDevice(d.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </>
        )}

        {/* SCHEDULE TAB */}
        {tab === 'schedule' && (
          <>
            <Text style={styles.sectionTitle}>Family Availability</Text>
            <Text style={styles.schedSub}>Overview of all member schedules</Text>
            {familySchedule.length === 0 && <Text style={styles.emptyText}>No schedule entries</Text>}
            {familySchedule
              .filter(s => s.unavailable)
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((s, i) => (
                <Animatable.View key={i} animation="fadeInUp" delay={i * 50} style={styles.schedCard}>
                  <View style={styles.schedDate}>
                    <Text style={styles.schedDateText}>{s.date.slice(5)}</Text>
                    <Text style={styles.schedYear}>{s.date.slice(0, 4)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.schedUser}>User ID: {s.user_id.slice(0, 8)}…</Text>
                    {s.note && <Text style={styles.schedNote}>{s.note}</Text>}
                  </View>
                  <View style={[styles.unavailBadge]}>
                    <Text style={styles.unavailText}>Unavailable</Text>
                  </View>
                </Animatable.View>
              ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  lockCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.2)',
  },
  lockTitle:    { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.white, marginTop: Spacing.md },
  lockSub:      { fontSize: Fonts.sizes.sm, color: Colors.gray400, marginBottom: Spacing.lg },
  pinRow:       { flexDirection: 'row', gap: 16, marginBottom: 8 },
  pinDot:       { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.accent },
  pinDotFilled: { backgroundColor: Colors.accent },
  pinError:     { color: Colors.danger, fontSize: Fonts.sizes.sm, marginBottom: 8 },
  numpad:       { flexDirection: 'row', flexWrap: 'wrap', width: 240, marginTop: Spacing.md, gap: 12, justifyContent: 'center' },
  numKey:       { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,200,220,0.12)', justifyContent: 'center', alignItems: 'center' },
  numKeyEmpty:  { backgroundColor: 'transparent' },
  numKeyText:   { color: Colors.white, fontSize: Fonts.sizes.lg, fontWeight: '600' },
  topBar:       { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.md },
  pageTitle:    { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  pageSub:      { fontSize: Fonts.sizes.sm, color: Colors.gray400 },
  tabRow:       { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.cardBg, borderRadius: Radius.full, padding: 4 },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: Radius.full },
  tabBtnActive: { backgroundColor: Colors.accent },
  tabText:      { fontSize: Fonts.sizes.sm, color: Colors.gray400, fontWeight: '600' },
  tabTextActive:{ color: Colors.primary },
  scroll:       { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  emptyText:    { color: Colors.gray400, textAlign: 'center', marginTop: Spacing.xl },
  memberCard:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'rgba(0,200,220,0.1)' },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { color: Colors.primary, fontWeight: '800', fontSize: Fonts.sizes.sm },
  memberName:   { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.white, marginBottom: 4 },
  rolePill:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  roleText:     { fontSize: Fonts.sizes.xs, fontWeight: '600' },
  removeBtn:    { padding: Spacing.sm },
  deviceCard:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'rgba(0,200,220,0.1)' },
  deviceName:   { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.white },
  deviceMeta:   { fontSize: Fonts.sizes.xs, color: Colors.gray400, marginTop: 2 },
  activeDot:    { width: 8, height: 8, borderRadius: 4 },
  schedSub:     { fontSize: Fonts.sizes.sm, color: Colors.gray400, marginBottom: Spacing.md },
  schedCard:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  schedDate:    { backgroundColor: Colors.danger + '22', padding: 8, borderRadius: Radius.md, alignItems: 'center', minWidth: 48 },
  schedDateText:{ color: Colors.danger, fontWeight: '800', fontSize: Fonts.sizes.sm },
  schedYear:    { color: Colors.danger + 'AA', fontSize: Fonts.sizes.xs },
  schedUser:    { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: '600' },
  schedNote:    { fontSize: Fonts.sizes.xs, color: Colors.gray400, marginTop: 2 },
  unavailBadge: { backgroundColor: Colors.danger + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  unavailText:  { color: Colors.danger, fontSize: Fonts.sizes.xs, fontWeight: '600' },
});
