import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GOAL = 10_000;

const StepCounter: React.FC = () => {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null); // null = loading
  const subRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!mounted) return;
      setAvailable(isAvailable);
      if (!isAvailable) return;

      // Fetch today's historical steps first
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        if (mounted) setSteps(result.steps);
      } catch (_) {}

      // Live subscription adds steps from the point of subscription
      subRef.current = Pedometer.watchStepCount(result => {
        if (mounted) setSteps(result.steps);
      });
    })();

    return () => {
      mounted = false;
      subRef.current?.remove();
    };
  }, []);

  const pct = Math.min(steps / GOAL, 1);
  const remaining = Math.max(GOAL - steps, 0);
  const distance = (steps * 0.0008).toFixed(2);
  const calories = Math.round(steps * 0.04);

  // Loading state
  if (available === null) return null;

  // Not supported on this device
  if (!available) {
    return (
      <View style={s.wrap}>
        <View style={s.unavailable}>
          <Ionicons name="walk-outline" size={20} color="#3F3F46" />
          <Text style={s.unavailableText}>Step counter not available on this device</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Ionicons name="footsteps-outline" size={13} color="#EF4444" />
            <Text style={s.headerLabel}>Steps Today</Text>
          </View>
          <Text style={s.goalLabel}>Goal: {GOAL.toLocaleString()}</Text>
        </View>

        <View style={s.divider} />

        {/* Body */}
        <View style={s.body}>
          {/* Step count */}
          <View style={s.countCol}>
            <Text style={s.stepCount}>{steps.toLocaleString()}</Text>
            <Text style={s.stepLabel}>steps</Text>
          </View>

          {/* Progress bar */}
          <View style={s.barCol}>
            <View style={s.barTrack}>
              <LinearGradient
                colors={pct >= 1 ? ['#22C55E', '#16A34A'] : ['#EF4444', '#F97316']}
                style={[s.barFill, { width: `${pct * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={s.barHint}>
              {pct >= 1
                ? '🎉 Goal reached!'
                : `${remaining.toLocaleString()} steps to go`}
            </Text>
          </View>

          {/* Stats */}
          <View style={s.statsCol}>
            <View style={s.stat}>
              <Ionicons name="location-outline" size={11} color="#71717A" />
              <Text style={s.statVal}>{distance} km</Text>
            </View>
            <View style={s.stat}>
              <Ionicons name="flame-outline" size={11} color="#71717A" />
              <Text style={s.statVal}>{calories} kcal</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginVertical: 6 },

  card: {
    backgroundColor: '#111',
    borderRadius: 14,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 38,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  goalLabel: { color: '#3F3F46', fontSize: 11, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#1A1A1A' },

  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },

  countCol: { alignItems: 'center', minWidth: 72 },
  stepCount: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  stepLabel: { color: '#52525B', fontSize: 10, fontWeight: '600', marginTop: 1 },

  barCol: { flex: 1 },
  barTrack: {
    height: 5,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 3 },
  barHint: { color: '#52525B', fontSize: 10, fontWeight: '500' },

  statsCol: { alignItems: 'flex-end', gap: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { color: '#71717A', fontSize: 11, fontWeight: '600' },

  unavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unavailableText: { color: '#3F3F46', fontSize: 12 },
});

export default StepCounter;
