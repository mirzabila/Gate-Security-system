// src/screens/DevicesScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, RefreshControl, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { DeviceAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../utils/theme';
import { formatDistanceToNow } from 'date-fns';

export default function DevicesScreen() {
  const [devices, setDevices]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setReg]       = useState(false);

  const load = async () => {
    try {
      const res = await DeviceAPI.myDevices();
      setDevices(res.data);
    } catch (_) {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRegister = async () => {
    setReg(true);
    try {
      let pushToken = null;
      if (Device.isDevice) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          pushToken = (await Notifications.getExpoPushTokenAsync()).data;
        }
      }
      await DeviceAPI.register({
        name: `${Device.modelName || 'My Phone'} (${Platform.OS})`,
        push_token: pushToken,
        platform: Platform.OS,
      });
      await load();
      Alert.alert('Success', 'Device registered for gate alerts!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Registration failed');
    } finally {
      setReg(false);
    }
  };

  const handleRemove = (id, name) => {
    Alert.alert('Remove Device', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await DeviceAPI.remove(id); await load(); }
        catch (_) { Alert.alert('Error', 'Failed to remove device'); }
      }},
    ]);
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View animation="fadeInUp" delay={index * 60}>
      <View style={styles.card}>
        <View style={[styles.platformIcon, {
          backgroundColor: item.platform === 'ios'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(61,220,132,0.1)',
        }]}>
          <Ionicons
            name={item.platform === 'ios' ? 'logo-apple' : 'logo-android'}
            size={26}
            color={item.platform === 'ios' ? Colors.white : Colors.success}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.platform}>{item.platform?.toUpperCase()}</Text>
          <Text style={styles.date}>
            Added {formatDistanceToNow(new Date(item.registered_at), { addSuffix: true })}
          </Text>
        </View>

        <View style={styles.right}>
          <View style={[styles.statusBadge, {
            backgroundColor: item.is_active ? Colors.success + '22' : Colors.danger + '22',
          }]}>
            <View style={[styles.statusDot, {
              backgroundColor: item.is_active ? Colors.success : Colors.danger,
            }]} />
            <Text style={[styles.statusText, {
              color: item.is_active ? Colors.success : Colors.danger,
            }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemove(item.id, item.name)}
            style={styles.removeBtn}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>My Devices</Text>
          <Text style={styles.pageSub}>{devices.length} device{devices.length !== 1 ? 's' : ''} registered</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, registering && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={registering}
        >
          <Ionicons name="add-circle" size={18} color={Colors.primary} />
          <Text style={styles.addBtnText}>{registering ? 'Adding…' : 'Add This Device'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
        ListEmptyComponent={
          <Animatable.View animation="fadeIn" style={styles.empty}>
            <Ionicons name="phone-portrait-outline" size={52} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No devices yet</Text>
            <Text style={styles.emptySub}>Tap "Add This Device" to register{'\n'}this phone for gate alerts</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleRegister} disabled={registering}>
              <Text style={styles.emptyBtnText}>{registering ? 'Registering…' : 'Register Now'}</Text>
            </TouchableOpacity>
          </Animatable.View>
        }
      />

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
        <Text style={styles.infoText}>
          Registered devices receive instant pop-up alerts when the gate bell rings.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  pageTitle: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  pageSub:   { fontSize: Fonts.sizes.sm,  color: Colors.gray400, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, ...Shadow.small,
  },
  addBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
  list: { padding: Spacing.lg, paddingTop: 4, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.12)',
    ...Shadow.small,
  },
  platformIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  deviceName: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  platform:   { fontSize: Fonts.sizes.xs, color: Colors.accent, fontWeight: '600', marginBottom: 2 },
  date:       { fontSize: Fonts.sizes.xs, color: Colors.gray400 },
  right:      { alignItems: 'flex-end', gap: Spacing.sm },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: Fonts.sizes.xs, fontWeight: '600' },
  removeBtn:  { padding: 4 },
  empty: {
    alignItems: 'center', gap: 10, marginTop: 60, paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { fontSize: Fonts.sizes.lg,  fontWeight: '700', color: Colors.white },
  emptySub:   { fontSize: Fonts.sizes.sm,  color: Colors.gray400, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: Radius.full,
  },
  emptyBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.md },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: Spacing.lg, marginTop: 0,
    backgroundColor: 'rgba(0,200,220,0.08)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.2)',
  },
  infoText: { flex: 1, fontSize: Fonts.sizes.xs, color: Colors.gray400, lineHeight: 18 },
});
