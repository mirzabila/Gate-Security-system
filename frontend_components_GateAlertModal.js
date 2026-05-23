// src/components/GateAlertModal.js
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration, Platform
} from 'react-native';
import Modal from 'react-native-modal';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { clearAlert } from '../store';
import { GateAPI } from '../services/api';
import { Colors, Fonts, Radius, Spacing } from '../utils/theme';

export default function GateAlertModal() {
  const dispatch   = useDispatch();
  const alert      = useSelector(s => s.alert.activeAlert);
  const isVisible  = !!alert;

  React.useEffect(() => {
    if (isVisible) {
      Vibration.vibrate(Platform.OS === 'ios' ? [0, 400, 200, 400] : [0, 500, 200, 500, 200, 500]);
    }
  }, [isVisible]);

  const handleAck = async () => {
    if (alert?.event_id) {
      try { await GateAPI.acknowledge(alert.event_id); } catch (_) {}
    }
    Vibration.cancel();
    dispatch(clearAlert());
  };

  const handleDismiss = () => {
    Vibration.cancel();
    dispatch(clearAlert());
  };

  return (
    <Modal
      isVisible={isVisible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropColor={Colors.overlay}
      backdropOpacity={1}
      useNativeDriver
    >
      <Animatable.View animation="pulse" iterationCount="infinite" duration={1200} style={styles.container}>
        {/* Pulsing ring */}
        <Animatable.View animation="pulse" iterationCount="infinite" duration={900} style={styles.ring} />

        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={44} color={Colors.primary} />
        </View>

        <Text style={styles.title}>🚪 Gate Alert!</Text>
        <Text style={styles.body}>{alert?.message || 'Someone is at the gate!'}</Text>
        {alert?.triggered_by && (
          <Text style={styles.sub}>Triggered by: {alert.triggered_by}</Text>
        )}
        {alert?.timestamp && (
          <Text style={styles.time}>
            {new Date(alert.timestamp).toLocaleTimeString()}
          </Text>
        )}

        <TouchableOpacity style={styles.btnAck} onPress={handleAck} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          <Text style={styles.btnText}>I'll Handle It</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnDismiss} onPress={handleDismiss} activeOpacity={0.75}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </Animatable.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  ring: {
    position:     'absolute',
    width:        300,
    height:       300,
    borderRadius: 150,
    borderWidth:  3,
    borderColor:  Colors.accent,
    opacity:      0.3,
  },
  iconWrap: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: Colors.accent,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    Spacing.md,
  },
  title: {
    fontSize:   Fonts.sizes.xl,
    fontWeight: '700',
    color:      Colors.primary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize:    Fonts.sizes.md,
    color:       Colors.gray600,
    textAlign:   'center',
    marginBottom: Spacing.sm,
  },
  sub: {
    fontSize:     Fonts.sizes.sm,
    color:        Colors.gray400,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize:     Fonts.sizes.xs,
    color:        Colors.gray400,
    marginBottom: Spacing.lg,
  },
  btnAck: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius:    Radius.full,
    width:           '100%',
    justifyContent:  'center',
    marginBottom:    Spacing.sm,
  },
  btnText: {
    color:      Colors.white,
    fontSize:   Fonts.sizes.md,
    fontWeight: '700',
  },
  btnDismiss: {
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    color:    Colors.gray400,
    fontSize: Fonts.sizes.sm,
  },
});
