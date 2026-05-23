// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '../store';
import { AuthAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', password: '', confirm: '', invite_key: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.password || !form.invite_key) {
      Alert.alert('Required', 'All fields are required.'); return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      const res = await AuthAPI.register({
        name: form.name.trim(),
        password: form.password,
        invite_key: form.invite_key.trim(),
      });
      await SecureStore.setItemAsync('token', res.data.access_token);
      dispatch(setToken(res.data.access_token));
      dispatch(setUser({ id: res.data.user_id, name: res.data.name, role: res.data.role }));
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240', Colors.secondary]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Join Gate Alert</Text>
          <Text style={styles.sub}>Enter the invite key given by your admin</Text>

          {[
            { key: 'name',       icon: 'person-outline',   placeholder: 'Full name',       secure: false },
            { key: 'invite_key', icon: 'key-outline',      placeholder: 'Invite key',      secure: false },
            { key: 'password',   icon: 'lock-closed-outline', placeholder: 'Password',     secure: true  },
            { key: 'confirm',    icon: 'shield-outline',   placeholder: 'Confirm password', secure: true },
          ].map(({ key, icon, placeholder, secure }) => (
            <View key={key} style={styles.inputWrap}>
              <Ionicons name={icon} size={18} color={Colors.accent} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.gray400}
                value={form[key]}
                onChangeText={(v) => set(key, v)}
                secureTextEntry={secure}
                autoCapitalize={key === 'name' ? 'words' : 'none'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Registering…' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: Colors.accent }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingTop: 60 },
  back:   { marginBottom: Spacing.xl },
  title:  { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  sub:    { fontSize: Fonts.sizes.sm, color: Colors.gray400, marginBottom: Spacing.xl },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md, borderWidth: 1,
    borderColor: 'rgba(0,200,220,0.25)',
    marginBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  icon:  { marginRight: Spacing.sm },
  input: { flex: 1, height: 48, color: Colors.white, fontSize: Fonts.sizes.md },
  btn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    height: 50, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.md },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginLinkText: { color: Colors.gray400, fontSize: Fonts.sizes.sm },
});
