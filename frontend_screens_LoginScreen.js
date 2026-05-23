// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '../store';
import { AuthAPI } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [name, setName]     = useState('');
  const [pass, setPass]     = useState('');
  const [showPass, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !pass.trim()) {
      Alert.alert('Required', 'Please enter your name and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await AuthAPI.login({ name: name.trim(), password: pass });
      await SecureStore.setItemAsync('token', res.data.access_token);
      dispatch(setToken(res.data.access_token));
      dispatch(setUser({ id: res.data.user_id, name: res.data.name, role: res.data.role }));
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.primary, '#0F2240', Colors.secondary]} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animatable.View animation="fadeInDown" delay={200} style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={50} color={Colors.accent} />
            </View>
            <Text style={styles.appName}>Gate Alert</Text>
            <Text style={styles.tagline}>Secure Family Network</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={400} style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.gray400}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.gray400}
                value={pass}
                onChangeText={setPass}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShow(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
              <Text style={styles.registerText}>New member? <Text style={{ color: Colors.accent }}>Register with key</Text></Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(0,200,220,0.15)',
    borderWidth: 2, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName:  { fontSize: Fonts.sizes.hero, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  tagline:  { fontSize: Fonts.sizes.sm, color: Colors.gray400, marginTop: 4 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1, borderColor: 'rgba(0,200,220,0.2)',
  },
  cardTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white, marginBottom: Spacing.lg },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(0,200,220,0.25)',
    marginBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 48, color: Colors.white, fontSize: Fonts.sizes.md },
  eyeBtn: { padding: Spacing.sm },
  loginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full, height: 50,
    justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.sm,
  },
  loginBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.md },
  registerLink: { alignItems: 'center', marginTop: Spacing.lg },
  registerText: { color: Colors.gray400, fontSize: Fonts.sizes.sm },
});
