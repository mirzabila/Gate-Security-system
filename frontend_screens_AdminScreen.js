// src/screens/AdminScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, RefreshControl, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { AdminAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../utils/theme';

const ADMIN_PIN = '1234'; // In production, store this securely

export default function AdminScreen() {
  const user      = useSelector(s => s.auth.user);
  const [unlocked, setUnlocked]   = useState(false);
  const [pin, setPin]             = useState('');
  const [pinError, setPinError]   = useState(false);
  const [stats, setStats]         = useState(null);
  const [families, setFamilies]   = useState([]);
  const [superKey, setSuperKey]   = useState(null);
  const [refresh, setRefresh]     = useState(false);
  const [addModal, setAddModal]   = useState(false);
  const [newFam, setNewFam]       = useState({ name: '', admin_name: '', max_devices: '4' });

  const load = async () => {
    try {
      if (user?.role === 'super_admin') {
        const [s, f, k] = await Promise.all([
          AdminAPI.getStats(),
          AdminAPI.getFamilies(),
          AdminAPI.getSuperKey(),
        ]);
        setStats(s.data);
        setFamilies(f.data);
        setSuperKey(k.data);
      }
    } catch (_) {}
  };

  useEffect(() => { if (unlocked) load(); }, [unlocked]);

  const handleUnlock = () => {
    if (pin === ADMIN_PIN) { setUnlocked(true); setPinError(false); }
    else { setPinError(true); setPin(''); }
  };

  const handleRegenKey = async () => {
    Alert.alert('Regenerate Key', 'This will invalidate the current super key. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Regenerate', style: 'destructive', onPress: async () => {
        try { const res = await AdminAPI.regenerateSuperKey(); setSuperKey(res.data); }
        catch (_) { Alert.alert('Error', 'Failed to regenerate'); }
      }},
    ]);
  };

  const handleAddFamily = async () => {
    if (!newFam.name || !newFam.admin_name) { Alert.alert('Required', 'Fill all fields'); return; }
    try {
      await AdminAPI.createFamily({ ...newFam, max_devices: parseInt(newFam.max_devices) || 4 });
      setAddModal(false);
      setNewFam({ name: '', admin_name: '', max_devices: '4' });
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const handleToggleFamily = async (fam) => {
    try {
      await AdminAPI.updateFamily(fam.id, { is_active: !fam.is_active });
      load();
    } catch (_) {}
  };

  const handleRegenFamilyKey = async (famId) => {
    try {
      const res = await AdminAPI.regenerateFamilyKey(famId);
      Alert.alert('New Key', res.data.invite_key);
      load();
    } catch (_) {}
  };

  if (!unlocked) {
    return (
      <LinearGradient colors={[Colors.primary, '#0F2240']} style={styles.lockScreen}>
        <Animatable.View animation="fadeIn" style={styles.lockCard}>
          <Ionicons name="lock-closed" size={48} color={Colors.accent} />
          <Text style={styles.lockTitle}>Admin Dashboard</Text>
          <Text style={styles.lockSub}>Enter your PIN to continue</Text>
          <View style={styles.pinRow}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
            ))}
          </View>
          {pinError && <Text style={styles.pinError}>Incorrect PIN</Text>}
          <View style={styles.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <TouchableOpacity key={i} style={[styles.numKey, !k && styles.numKeyEmpty]}
                onPress={() => {
                  if (!k) return;
                  if (k === '⌫') { setPin(p => p.slice(0, -1)); setPinError(false); }
                  else if (pin.length < 4) { const np = pin + k; setPin(np); if (np.length === 4) setTimeout(() => handleUnlock(), 100); }
                }}
              >
                <Text style={styles.numKeyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await load(); setRefresh(false); }} tintColor={Colors.accent} />}
      >
        <Text style={styles.pageTitle}>Admin Dashboard</Text>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            {[
              { label: 'Families', value: stats.total_families, icon: 'people' },
              { label: 'Users',    value: stats.total_users,    icon: 'person' },
              { label: 'Devices',  value: stats.total_devices,  icon: 'phone-portrait' },
              { label: 'Events',   value: stats.total_events,   icon: 'notifications' },
            ].map(({ label, value, icon }) => (
              <Animatable.View key={label} animation="fadeInUp" style={styles.statCard}>
                <Ionicons name={icon} size={20} color={Colors.accent} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </Animatable.View>
            ))}
          </View>
        )}

        {/* Super key */}
        {superKey && (
          <Animatable.View animation="fadeInUp" style={styles.keyCard}>
            <View style={styles.keyHeader}>
              <Text style={styles.keyTitle}>Super Key</Text>
              <TouchableOpacity onPress={handleRegenKey}>
                <Ionicons name="refresh" size={20} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <Text style={styles.keyValue}>{superKey.key_value}</Text>
            <Text style={styles.keySub}>Max devices: {superKey.max_devices}</Text>
          </Animatable.View>
        )}

        {/* Families */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Families</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {families.map((fam, i) => (
          <Animatable.View key={fam.id} animation="fadeInUp" delay={i * 60} style={styles.famCard}>
            <View style={styles.famHeader}>
              <View>
                <Text style={styles.famName}>{fam.name}</Text>
                <Text style={styles.famAdmin}>{fam.admin_name}</Text>
              </View>
              <TouchableOpacity
                style={[styles.statusBtn, { backgroundColor: fam.is_active ? Colors.success + '22' : Colors.danger + '22' }]}
                onPress={() => handleToggleFamily(fam)}
              >
                <Text style={{ color: fam.is_active ? Colors.success : Colors.danger, fontSize: Fonts.sizes.xs, fontWeight: '600' }}>
                  {fam.is_active ? 'Active' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.famMeta}>
              <Text style={styles.famMetaText}>👥 {fam.member_count} members · 📱 {fam.device_count}/{fam.max_devices} devices</Text>
            </View>
            <View style={styles.famKeyRow}>
              <Text style={styles.famKey} numberOfLines={1}>{fam.invite_key}</Text>
              <TouchableOpacity onPress={() => handleRegenFamilyKey(fam.id)}>
                <Ionicons name="refresh-outline" size={16} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        ))}
      </ScrollView>

      {/* Add family modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Family</Text>
            {[
              { key: 'name',        label: 'Family name' },
              { key: 'admin_name',  label: 'Admin name'  },
              { key: 'max_devices', label: 'Max devices' },
            ].map(({ key, label }) => (
              <TextInput
                key={key}
                style={styles.modalInput}
                placeholder={label}
                placeholderTextColor={Colors.gray400}
                value={newFam[key]}
                onChangeText={v => setNewFam(f => ({ ...f, [key]: v }))}
                keyboardType={key === 'max_devices' ? 'number-pad' : 'default'}
              />
            ))}
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddFamily}>
              <Text style={styles.modalBtnText}>Create Family</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAddModal(false)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: Colors.gray400 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scroll:       { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100 },
  pageTitle:    { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white, marginBottom: Spacing.lg },
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, minWidth: '40%', backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.15)', gap: 4,
  },
  statValue:     { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white },
  statLabel:     { fontSize: Fonts.sizes.xs, color: Colors.gray400 },
  keyCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.25)',
  },
  keyHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  keyTitle:     { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  keyValue:     { fontSize: 13, color: Colors.accent, fontFamily: 'monospace', marginBottom: 4 },
  keySub:       { fontSize: Fonts.sizes.xs, color: Colors.gray400 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:  { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  addBtnText:    { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
  famCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.1)',
  },
  famHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  famName:      { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  famAdmin:     { fontSize: Fonts.sizes.sm, color: Colors.gray400 },
  statusBtn:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  famMeta:      { marginBottom: 8 },
  famMetaText:  { fontSize: Fonts.sizes.xs, color: Colors.gray400 },
  famKeyRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,200,220,0.08)', padding: 8, borderRadius: Radius.sm },
  famKey:       { flex: 1, fontSize: 11, color: Colors.accent, fontFamily: 'monospace' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.cardBg, borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.2)',
  },
  modalTitle:   { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.25)',
    height: 48, paddingHorizontal: Spacing.md, color: Colors.white,
    fontSize: Fonts.sizes.md, marginBottom: Spacing.sm,
  },
  modalBtn:     { backgroundColor: Colors.accent, borderRadius: Radius.full, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.md },
});
