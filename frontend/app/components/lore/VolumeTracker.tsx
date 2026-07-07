import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Dimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_W = Dimensions.get('window').width;
const WEIGHT_CACHE_KEY = 'grind_exercise_weight_cache';

// ─── Constants ────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other'] as const;
type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  all: 'All', chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  arms: 'Arms', legs: 'Legs', core: 'Core', cardio: 'Cardio', other: 'Other',
};

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  all: '#EF4444', chest: '#F97316', back: '#3B82F6', shoulders: '#FACC15',
  arms: '#22C55E', legs: '#EAB308', core: '#EC4899', cardio: '#06B6D4', other: '#6B7280',
};

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  all: 'body-outline', chest: 'fitness-outline', back: 'arrow-back-outline',
  shoulders: 'barbell-outline', arms: 'hand-left-outline', legs: 'walk-outline',
  core: 'ellipse-outline', cardio: 'heart-outline', other: 'apps-outline',
};

const PRESET_EXERCISES: { name: string; muscleGroup: string }[] = [
  { name: 'Bench Press', muscleGroup: 'chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest' },
  { name: 'Cable Crossover', muscleGroup: 'chest' },
  { name: 'Chest Dips', muscleGroup: 'chest' },
  { name: 'Push-ups', muscleGroup: 'chest' },
  { name: 'Pull-ups', muscleGroup: 'back' },
  { name: 'Barbell Row', muscleGroup: 'back' },
  { name: 'Lat Pulldown', muscleGroup: 'back' },
  { name: 'Deadlift', muscleGroup: 'back' },
  { name: 'Seated Cable Row', muscleGroup: 'back' },
  { name: 'T-Bar Row', muscleGroup: 'back' },
  { name: 'Overhead Press', muscleGroup: 'shoulders' },
  { name: 'Lateral Raises', muscleGroup: 'shoulders' },
  { name: 'Front Raises', muscleGroup: 'shoulders' },
  { name: 'Rear Delt Fly', muscleGroup: 'shoulders' },
  { name: 'Bicep Curls', muscleGroup: 'arms' },
  { name: 'Hammer Curls', muscleGroup: 'arms' },
  { name: 'Tricep Pushdowns', muscleGroup: 'arms' },
  { name: 'Skull Crushers', muscleGroup: 'arms' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'arms' },
  { name: 'Barbell Squat', muscleGroup: 'legs' },
  { name: 'Leg Press', muscleGroup: 'legs' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs' },
  { name: 'Lunges', muscleGroup: 'legs' },
  { name: 'Leg Curl', muscleGroup: 'legs' },
  { name: 'Calf Raises', muscleGroup: 'legs' },
  { name: 'Hip Thrust', muscleGroup: 'legs' },
  { name: 'Plank', muscleGroup: 'core' },
  { name: 'Crunches', muscleGroup: 'core' },
  { name: 'Ab Wheel', muscleGroup: 'core' },
  { name: 'Running', muscleGroup: 'cardio' },
  { name: 'Cycling', muscleGroup: 'cardio' },
  { name: 'Jump Rope', muscleGroup: 'cardio' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ExEntry = {
  name: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  weight: string;
  suggestions: { name: string; muscleGroup: string }[];
};

type DayLog = {
  date: string;
  totalVolume: number;
  byMuscle: Record<string, number>;
};

type PRRecord = { muscle: string; volume: number; previous: number };

const emptyEntry = (): ExEntry => ({
  name: '', muscleGroup: 'chest', sets: '', reps: '', weight: '', suggestions: [],
});

const fmtVol = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, color }: { data: { label: string; volume: number }[]; color: string }) {
  const maxVol = Math.max(...data.map(d => d.volume), 1);
  const BAR_MAX = 90;

  if (data.length === 0) {
    return (
      <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="bar-chart-outline" size={32} color="#2A2A2A" />
        <Text style={{ color: '#444', fontSize: 12, marginTop: 8 }}>No data yet — log a workout!</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX + 30 }}>
        <View style={{ justifyContent: 'space-between', height: BAR_MAX, marginRight: 6 }}>
          <Text style={{ color: '#444', fontSize: 9 }}>{fmtVol(maxVol)}</Text>
          <Text style={{ color: '#444', fontSize: 9 }}>{fmtVol(maxVol / 2)}</Text>
          <Text style={{ color: '#444', fontSize: 9 }}>0</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX + 30, paddingRight: 8 }}>
            {data.map((d, i) => {
              const barH = d.volume > 0 ? Math.max((d.volume / maxVol) * BAR_MAX, 4) : 0;
              return (
                <View key={i} style={{ alignItems: 'center', marginRight: 6, minWidth: 28 }}>
                  {d.volume > 0 && (
                    <Text style={{ color: color, fontSize: 8, marginBottom: 3, fontWeight: '700' }}>
                      {fmtVol(d.volume)}
                    </Text>
                  )}
                  <View style={{ width: 24, height: barH, backgroundColor: color, borderRadius: 4, opacity: d.volume > 0 ? 1 : 0 }} />
                  <Text style={{ color: '#555', fontSize: 8, marginTop: 4, textAlign: 'center' }}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View style={{ position: 'absolute', top: 0, left: 28, right: 0, height: 1, backgroundColor: '#1A1A1A' }} />
      <View style={{ position: 'absolute', top: BAR_MAX / 2, left: 28, right: 0, height: 1, backgroundColor: '#1A1A1A' }} />
    </View>
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

function ExerciseRow({ entry, index, onChange, onRemove, weightCache }: {
  entry: ExEntry;
  index: number;
  onChange: (i: number, field: keyof ExEntry, value: any) => void;
  onRemove: (i: number) => void;
  weightCache: Record<string, number>;
}) {
  const w = parseFloat(entry.weight || '0');
  const s = parseFloat(entry.sets || '0');
  const r = parseFloat(entry.reps || '0');
  const displayVolume = s * r * w;
  const oneRM = w > 0 && r > 0 && r <= 12 ? Math.round(w * (1 + r / 30)) : null;
  const lastWeight = entry.name ? weightCache[entry.name] : undefined;

  const handleNameChange = (text: string) => {
    const suggestions = text.length > 1
      ? PRESET_EXERCISES.filter(e => e.name.toLowerCase().includes(text.toLowerCase())).slice(0, 4)
      : [];
    onChange(index, 'name', text);
    onChange(index, 'suggestions', suggestions);
  };

  const selectPreset = (preset: { name: string; muscleGroup: string }) => {
    onChange(index, 'name', preset.name);
    onChange(index, 'muscleGroup', preset.muscleGroup);
    onChange(index, 'suggestions', []);
    const lastW = weightCache[preset.name];
    if (lastW && !entry.weight) onChange(index, 'weight', String(lastW));
  };

  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Exercise {index + 1}</Text>
        {index > 0 && (
          <TouchableOpacity onPress={() => onRemove(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        value={entry.name}
        onChangeText={handleNameChange}
        placeholder="Exercise name (e.g. Bench Press)"
        placeholderTextColor="#3A3A3A"
        style={{
          backgroundColor: '#111', color: '#fff', borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 9, fontSize: 13,
          borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 4,
        }}
      />

      {entry.suggestions.length > 0 && (
        <View style={{ backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 8 }}>
          {entry.suggestions.map((s, si) => (
            <TouchableOpacity
              key={si}
              onPress={() => selectPreset(s)}
              style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingHorizontal: 12, paddingVertical: 9,
                borderBottomWidth: si < entry.suggestions.length - 1 ? 1 : 0,
                borderBottomColor: '#1A1A1A',
              }}
            >
              <Text style={{ color: '#D1D5DB', fontSize: 12 }}>{s.name}</Text>
              <View style={{ backgroundColor: MUSCLE_COLORS[s.muscleGroup as MuscleGroup] + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: MUSCLE_COLORS[s.muscleGroup as MuscleGroup], fontSize: 10, fontWeight: '600' }}>
                  {MUSCLE_LABELS[s.muscleGroup as MuscleGroup] ?? s.muscleGroup}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {MUSCLE_GROUPS.filter(m => m !== 'all').map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => onChange(index, 'muscleGroup', m)}
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6,
              backgroundColor: entry.muscleGroup === m ? MUSCLE_COLORS[m] + '33' : '#111',
              borderWidth: 1, borderColor: entry.muscleGroup === m ? MUSCLE_COLORS[m] : '#2A2A2A',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: entry.muscleGroup === m ? MUSCLE_COLORS[m] : '#555' }}>
              {MUSCLE_LABELS[m]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([
          { key: 'sets', label: 'Sets' },
          { key: 'reps', label: 'Reps' },
          { key: 'weight', label: 'Weight (kg)' },
        ] as const).map(({ key, label }) => (
          <View key={key} style={{ flex: 1 }}>
            <Text style={{ color: '#555', fontSize: 10, marginBottom: 4, fontWeight: '600' }}>{label}</Text>
            <TextInput
              value={entry[key]}
              onChangeText={v => onChange(index, key, v)}
              keyboardType="numeric"
              placeholder={key === 'weight' && lastWeight ? `${lastWeight}` : '0'}
              placeholderTextColor={key === 'weight' && lastWeight ? '#4A4A4A' : '#2A2A2A'}
              style={{
                backgroundColor: '#111', color: '#fff', borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontWeight: '700',
                borderWidth: 1, borderColor: '#2A2A2A', textAlign: 'center',
              }}
            />
            {key === 'weight' && lastWeight && !entry.weight && (
              <Text style={{ color: '#3A3A3A', fontSize: 9, marginTop: 2, textAlign: 'center' }}>
                Last: {lastWeight}kg
              </Text>
            )}
          </View>
        ))}
      </View>

      {displayVolume > 0 && (
        <Text style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
          Volume: <Text style={{ color: '#EF4444', fontWeight: '700' }}>{fmtVol(displayVolume)} kg</Text>
          {' '}({entry.sets} × {entry.reps} × {entry.weight}kg)
        </Text>
      )}
      {oneRM !== null && (
        <Text style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
          Est. 1RM: <Text style={{ color: '#F97316', fontWeight: '700' }}>{oneRM}kg</Text>
        </Text>
      )}
    </View>
  );
}

// ─── Main VolumeTracker ───────────────────────────────────────────────────────

export default function VolumeTracker({ userId, token }: { userId: string; token: string }) {
  const [history, setHistory] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('all');
  const [logVisible, setLogVisible] = useState(false);
  const [entries, setEntries] = useState<ExEntry[]>([emptyEntry()]);
  const [saving, setSaving] = useState(false);
  const [weightCache, setWeightCache] = useState<Record<string, number>>({});
  const [newPRs, setNewPRs] = useState<PRRecord[]>([]);
  const [showPRBanner, setShowPRBanner] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/workout-log/${userId}?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setHistory(data.data ?? []);
    } catch (e) {
      console.error('Volume fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchHistory();
    AsyncStorage.getItem(WEIGHT_CACHE_KEY).then(v => {
      if (v) setWeightCache(JSON.parse(v));
    }).catch(() => {});
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  // ── Week-over-week comparison ──
  const todayStr = new Date().toISOString().split('T')[0];
  const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];
  const lastWeekStart = new Date(); lastWeekStart.setDate(lastWeekStart.getDate() - 14);
  const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

  const muscleVol = (day: DayLog) =>
    selectedMuscle === 'all' ? day.totalVolume : (day.byMuscle[selectedMuscle] ?? 0);

  const thisWeekVol = history
    .filter(d => d.date >= thisWeekStartStr && d.date <= todayStr)
    .reduce((s, d) => s + muscleVol(d), 0);
  const lastWeekVol = history
    .filter(d => d.date >= lastWeekStartStr && d.date < thisWeekStartStr)
    .reduce((s, d) => s + muscleVol(d), 0);
  const weekPct = lastWeekVol > 0
    ? Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100)
    : null;

  const chartData = history
    .map(day => ({ label: fmtDate(day.date).replace(' ', '\n'), volume: muscleVol(day) }))
    .filter(d => d.volume > 0);

  const totalVol = chartData.reduce((s, d) => s + d.volume, 0);
  const maxVol = chartData.length > 0 ? Math.max(...chartData.map(d => d.volume)) : 0;
  const sessions = chartData.length;

  const handleChange = (i: number, field: keyof ExEntry, value: any) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const handleRemove = (i: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    const valid = entries.filter(e => e.name && e.sets && e.reps);
    if (!valid.length) {
      Alert.alert('Missing info', 'Fill in at least one exercise with sets and reps.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/workout-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          exercises: valid.map(e => ({
            name: e.name,
            muscleGroup: e.muscleGroup,
            sets: parseInt(e.sets),
            reps: parseInt(e.reps),
            weight: parseFloat(e.weight) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Persist last-used weights
      const newCache = { ...weightCache };
      valid.forEach(e => {
        if (e.name && parseFloat(e.weight) > 0) newCache[e.name] = parseFloat(e.weight);
      });
      setWeightCache(newCache);
      AsyncStorage.setItem(WEIGHT_CACHE_KEY, JSON.stringify(newCache)).catch(() => {});

      // Handle PRs
      if (data.newPRs?.length) {
        setNewPRs(data.newPRs);
        setShowPRBanner(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }

      setLogVisible(false);
      setEntries([emptyEntry()]);
      await fetchHistory();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save workout');
    } finally {
      setSaving(false);
    }
  };

  const color = MUSCLE_COLORS[selectedMuscle];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />}
    >
      {/* ── PR Banner ── */}
      {showPRBanner && newPRs.length > 0 && (
        <View style={{
          backgroundColor: '#78350F', borderRadius: 14, padding: 14, marginBottom: 16,
          borderWidth: 1, borderColor: '#EAB308',
          flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        }}>
          <Text style={{ fontSize: 22, lineHeight: 26 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FDE68A', fontWeight: '800', fontSize: 14, marginBottom: 4 }}>
              New Personal Record!
            </Text>
            {newPRs.map((pr, i) => (
              <Text key={i} style={{ color: '#FCD34D', fontSize: 12, marginTop: 1 }}>
                {MUSCLE_LABELS[pr.muscle as MuscleGroup] ?? pr.muscle}: {fmtVol(pr.volume)}kg
                <Text style={{ color: '#92400E' }}> (was {fmtVol(pr.previous)}kg)</Text>
              </Text>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowPRBanner(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#92400E" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Muscle group selector ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {MUSCLE_GROUPS.map(m => {
          const active = selectedMuscle === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMuscle(m)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, marginRight: 8,
                backgroundColor: active ? MUSCLE_COLORS[m] : '#111',
                borderWidth: 1, borderColor: active ? MUSCLE_COLORS[m] : '#222',
              }}
            >
              <Ionicons name={MUSCLE_ICONS[m] as any} size={13} color={active ? '#fff' : '#555'} />
              <Text style={{ color: active ? '#fff' : '#666', fontSize: 12, fontWeight: '700' }}>
                {MUSCLE_LABELS[m]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Stats row ── */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total Vol', value: fmtVol(totalVol) + 'kg', icon: 'barbell-outline' },
          { label: 'Best Session', value: fmtVol(maxVol) + 'kg', icon: 'trophy-outline' },
          { label: 'Sessions', value: `${sessions}`, icon: 'calendar-outline' },
          {
            label: 'vs Last Wk',
            value: weekPct === null ? '—' : `${weekPct > 0 ? '+' : ''}${weekPct}%`,
            icon: weekPct !== null && weekPct >= 0 ? 'trending-up-outline' : 'trending-down-outline',
            valueColor: weekPct === null ? '#555' : weekPct > 0 ? '#22C55E' : weekPct < 0 ? '#EF4444' : '#888',
          },
        ].map(s => (
          <View key={s.label} style={{
            flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 10, alignItems: 'center',
          }}>
            <Ionicons name={s.icon as any} size={14} color={color} style={{ marginBottom: 4 }} />
            <Text style={{ color: (s as any).valueColor ?? '#fff', fontSize: 13, fontWeight: '800' }}>
              {s.value}
            </Text>
            <Text style={{ color: '#444', fontSize: 9, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Chart ── */}
      <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
            {MUSCLE_LABELS[selectedMuscle]} Volume
          </Text>
          <Text style={{ color: '#444', fontSize: 11 }}>Last 30 days</Text>
        </View>
        {loading ? (
          <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={color} />
          </View>
        ) : (
          <BarChart data={chartData} color={color} />
        )}
      </View>

      {/* ── Log button ── */}
      <TouchableOpacity
        onPress={() => setLogVisible(true)}
        style={{
          backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 14,
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
          marginBottom: 20,
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Log Today's Workout</Text>
      </TouchableOpacity>

      {/* ── Recent logs ── */}
      {history.length > 0 && (
        <View>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 12 }}>Recent Sessions</Text>
          {[...history].reverse().slice(0, 7).map((day, i) => (
            <View key={i} style={{
              backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 8,
              borderLeftWidth: 3, borderLeftColor: color,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{fmtDate(day.date)}</Text>
                <Text style={{ color: color, fontSize: 13, fontWeight: '800' }}>
                  {fmtVol(day.totalVolume)}kg total
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {Object.entries(day.byMuscle).map(([muscle, vol]) => (
                  <View key={muscle} style={{
                    backgroundColor: (MUSCLE_COLORS[muscle as MuscleGroup] ?? '#555') + '22',
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
                    borderWidth: 1, borderColor: (MUSCLE_COLORS[muscle as MuscleGroup] ?? '#555') + '44',
                  }}>
                    <Text style={{ color: MUSCLE_COLORS[muscle as MuscleGroup] ?? '#555', fontSize: 11, fontWeight: '600' }}>
                      {MUSCLE_LABELS[muscle as MuscleGroup] ?? muscle}: {fmtVol(vol)}kg
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Log Workout Modal ── */}
      <Modal visible={logVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLogVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: '#1C1E20' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Log Workout</Text>
            <TouchableOpacity onPress={() => { setLogVisible(false); setEntries([emptyEntry()]); }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>
              Volume = Sets × Reps × Weight (kg). Use 0 for bodyweight.
            </Text>

            {entries.map((entry, i) => (
              <ExerciseRow
                key={i}
                entry={entry}
                index={i}
                onChange={handleChange}
                onRemove={handleRemove}
                weightCache={weightCache}
              />
            ))}

            <TouchableOpacity
              onPress={() => setEntries(prev => [...prev, emptyEntry()])}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, paddingVertical: 12, borderRadius: 12,
                borderWidth: 1, borderColor: '#2A2A2A', borderStyle: 'dashed', marginBottom: 20,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#555" />
              <Text style={{ color: '#555', fontSize: 13, fontWeight: '600' }}>Add Another Exercise</Text>
            </TouchableOpacity>

            {(() => {
              const totalPreview = entries.reduce((sum, e) => {
                const v = parseFloat(e.sets || '0') * parseFloat(e.reps || '0') * parseFloat(e.weight || '0');
                return sum + v;
              }, 0);
              return totalPreview > 0 ? (
                <View style={{
                  backgroundColor: '#EF444411', borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: '#EF444433', marginBottom: 16,
                  flexDirection: 'row', justifyContent: 'space-between',
                }}>
                  <Text style={{ color: '#888', fontSize: 13 }}>Session volume</Text>
                  <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '800' }}>
                    {fmtVol(totalPreview)} kg
                  </Text>
                </View>
              ) : null;
            })()}

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 15,
                alignItems: 'center', opacity: saving ? 0.7 : 1,
              }}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Save Session</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
