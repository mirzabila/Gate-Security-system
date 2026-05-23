// src/screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../utils/theme';

const ROLE_LABELS = {
  super_admin:  '⭐ Super Admin',
  family_admin: '👑 Family Admin',
  member:       '👤 Member',
};

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user     = useSelector(s => s.auth.user);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('token');
        dispatch(logout());
      }},
    ]);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animatable.View animation="fadeInDown" style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{ROLE_LABELS[user?.role] || user?.role}</Text>
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={200} style={styles.card}>
          {[
            { icon: 'person-outline',     label: 'Name',      value: user?.name },
            { icon: 'shield-outline',     label: 'Role',      value: ROLE_LABELS[user?.role] },
            { icon: 'finger-print-outline',label: 'ID',       value: user?.id?.slice(0, 8) + '…' },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Ionicons name={icon} size={18} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            </View>
          ))}
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={350} style={styles.card}>
          <Text style={styles.cardTitle}>About Gate Alert</Text>
          <Text style={styles.cardBody}>
            Gate Alert is a secure family communication system. When someone rings the gate,
            all connected family members receive an instant notification and can acknowledge it
            through the app — no direct calls needed.
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={450}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={Colors.white} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animatable.View>

        <Text style={styles.version}>Gate Alert v1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:      { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100, alignItems: 'center' },
  avatarWrap:  { alignItems: 'center', marginBottom: Spacing.xl },
  avatar:      { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, ...Shadow.medium },
  avatarText:  { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.primary },
  name:        { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.white, marginBottom: 6 },
  roleBadge:   { backgroundColor: 'rgba(0,200,220,0.15)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(0,200,220,0.3)' },
  roleText:    { color: Colors.accent, fontSize: Fonts.sizes.sm, fontWeight: '600' },
  card: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.lg, width: '100%', marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.15)',
  },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)' },
  infoLabel:  { fontSize: Fonts.sizes.xs, color: Colors.gray400 },
  infoValue:  { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: '500', marginTop: 2 },
  cardTitle:  { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, marginBottom: Spacing.sm },
  cardBody:   { fontSize: Fonts.sizes.sm, color: Colors.gray400, lineHeight: 22 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.danger, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, justifyContent: 'center', width: '100%', marginTop: 8 },
  logoutText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.md },
  version:    { color: Colors.gray400, fontSize: Fonts.sizes.xs, marginTop: Spacing.xl },
});
