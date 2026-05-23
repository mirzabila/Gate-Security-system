// src/screens/NotificationsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setNotifs, markRead } from '../store';
import { NotifAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../utils/theme';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const dispatch      = useDispatch();
  const notifs        = useSelector(s => s.notif.list);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await NotifAPI.getAll();
      dispatch(setNotifs(res.data));
    } catch (_) {}
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id) => {
    dispatch(markRead(id));
    try { await NotifAPI.markRead(id); } catch (_) {}
  };

  const handleReadAll = async () => {
    try {
      await NotifAPI.markAllRead();
      await load();
    } catch (_) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View animation="fadeInUp" delay={index * 50}>
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={() => handleRead(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: item.is_read ? Colors.gray600 + '33' : Colors.accent + '22' }]}>
          <Ionicons
            name={item.is_read ? 'notifications-outline' : 'notifications'}
            size={20}
            color={item.is_read ? Colors.gray400 : Colors.accent}
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.is_read && styles.titleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Notifications</Text>
        {notifs.some(n => !n.is_read) && (
          <TouchableOpacity onPress={handleReadAll} style={styles.readAllBtn}>
            <Text style={styles.readAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
        ListEmptyComponent={
          <Animatable.View animation="fadeIn" style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.gray400} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySub}>Gate alerts will appear here</Text>
          </Animatable.View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  pageTitle:   { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  readAllBtn:  { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,200,220,0.15)', borderRadius: Radius.full },
  readAllText: { color: Colors.accent, fontSize: Fonts.sizes.sm, fontWeight: '600' },
  list:        { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardUnread: {
    borderColor: 'rgba(0,200,220,0.25)',
    backgroundColor: '#0F2240',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  content:     { flex: 1 },
  title:       { fontSize: Fonts.sizes.sm, color: Colors.gray400, fontWeight: '500', marginBottom: 3 },
  titleUnread: { color: Colors.white, fontWeight: '700' },
  body:        { fontSize: Fonts.sizes.sm, color: Colors.gray400, lineHeight: 20, marginBottom: 4 },
  time:        { fontSize: Fonts.sizes.xs, color: Colors.gray600 },
  unreadDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 6 },
  empty:       { alignItems: 'center', gap: 8, marginTop: 80 },
  emptyText:   { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white },
  emptySub:    { fontSize: Fonts.sizes.sm, color: Colors.gray400 },
});
