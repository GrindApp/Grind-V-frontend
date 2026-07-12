import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, RefreshControl, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
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

type SetEntry = {
  reps: string;
  weight: string;
};

type ExEntry = {
  name: string;
  muscleGroup: string;
  sets: SetEntry[];
  suggestions: { name: string; muscleGroup: string }[];
};

type DayLog = {
  date: string;
  totalVolume: number;
  byMuscle: Record<string, number>;
};

type PRRecord = { muscle: string; volume: number; previous: number };

const emptySet = (): SetEntry => ({ reps: '', weight: '' });
const emptyEntry = (): ExEntry => ({
  name: '', muscleGroup: 'chest', sets: [emptySet()], suggestions: [],
});

const fmtVol = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k kg` : `${Math.round(v)} kg`;
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Line Chart ───────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get('window').width;

function VolumeLineChart({ data, color }: { data: { label: string; volume: number }[]; color: string }) {
  if (data.length === 0) {
    return (
      <View style={{ height: 140, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="trending-up-outline" size={32} color="#2A2A2A" />
        <Text style={{ color: '#444', fontSize: 12, marginTop: 8 }}>No data yet — log a workout!</Text>
      </View>
    );
  }

  const spacing = 44;
  const labelEvery = data.length > 14 ? 3 : 1;

  const lineData = data.map((d, i) => ({
    value: d.volume,
    label: i % labelEvery === 0 ? d.label.replace('\n', ' ') : '',
  }));

  const maxValue = Math.max(...data.map(d => d.volume));

  return (
    <LineChart
      data={lineData}
      color={color}
      thickness={2.5}
      curved
      areaChart
      startFillColor={color}
      endFillColor={color}
      startOpacity={0.28}
      endOpacity={0.02}
      initialSpacing={12}
      spacing={spacing}
      backgroundColor="transparent"
      rulesColor="#1A1A1A"
      rulesType="solid"
      yAxisColor="transparent"
      xAxisColor="#1E1E1E"
      yAxisTextStyle={{ color: '#444', fontSize: 9 }}
      xAxisLabelTextStyle={{ color: '#555', fontSize: 8 }}
      dataPointsColor={color}
      dataPointsRadius={data.length > 20 ? 2 : 4}
      noOfSections={3}
      maxValue={maxValue * 1.2}
      width={SCREEN_W - 96}
      height={130}
      scrollToEnd
      pointerConfig={{
        pointerStripHeight: 115,
        pointerStripColor: '#2A2A2A',
        pointerStripWidth: 1,
        pointerColor: color,
        radius: 5,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: any[]) => (
          <View style={{
            backgroundColor: '#1A1A1A', borderRadius: 8, padding: 8,
            borderWidth: 1, borderColor: '#2A2A2A',
            alignItems: 'center', minWidth: 64,
          }}>
            <Text style={{ color, fontSize: 13, fontWeight: '800' }}>
              {fmtVol(items[0].value)}
            </Text>
          </View>
        ),
      }}
    />
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

function ExerciseRow({
  entry, index, existingNames, onChange, onSetChange, onAddSet, onRemoveSet, onRemove, weightCache,
}: {
  entry: ExEntry;
  index: number;
  existingNames: string[];
  onChange: (i: number, field: Exclude<keyof ExEntry, 'sets'>, value: any) => void;
  onSetChange: (exIdx: number, setIdx: number, field: keyof SetEntry, value: string) => void;
  onAddSet: (exIdx: number) => void;
  onRemoveSet: (exIdx: number, setIdx: number) => void;
  onRemove: (i: number) => void;
  weightCache: Record<string, number>;
}) {
  const lastWeight = entry.name ? weightCache[entry.name] : undefined;

  const exerciseVolume = entry.sets.reduce((sum, s) => {
    return sum + (parseFloat(s.weight || '0') * parseFloat(s.reps || '0'));
  }, 0);

  const handleNameChange = (text: string) => {
    const suggestions = text.length > 1
      ? PRESET_EXERCISES
          .filter(e =>
            e.name.toLowerCase().includes(text.toLowerCase()) &&
            !existingNames.includes(e.name.toLowerCase())
          )
          .slice(0, 4)
      : [];
    onChange(index, 'name', text);
    onChange(index, 'suggestions', suggestions);
  };

  const selectPreset = (preset: { name: string; muscleGroup: string }) => {
    if (existingNames.includes(preset.name.toLowerCase())) {
      Alert.alert(
        'Already added',
        `${preset.name} is already in this session. Add more sets to it instead.`
      );
      return;
    }
    onChange(index, 'name', preset.name);
    onChange(index, 'muscleGroup', preset.muscleGroup);
    onChange(index, 'suggestions', []);
    const lastW = weightCache[preset.name];
    if (lastW) onSetChange(index, 0, 'weight', String(lastW));
  };

  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 10 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Exercise {index + 1}</Text>
        {index > 0 && (
          <TouchableOpacity onPress={() => onRemove(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Name input */}
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

      {/* Suggestions */}
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

      {/* Muscle group pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
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

      {/* Column headers */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 2 }}>
        <Text style={{ color: '#333', fontSize: 9, fontWeight: '700', width: 28, textAlign: 'center' }}>SET</Text>
        <Text style={{ color: '#333', fontSize: 9, fontWeight: '700', flex: 1, textAlign: 'center' }}>REPS</Text>
        <Text style={{ color: '#333', fontSize: 9, fontWeight: '700', flex: 1, textAlign: 'center' }}>WEIGHT KG</Text>
        <Text style={{ color: '#333', fontSize: 9, fontWeight: '700', width: 40, textAlign: 'center' }}>VOL</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Set rows */}
      {entry.sets.map((set, si) => {
        const setVol = parseFloat(set.reps || '0') * parseFloat(set.weight || '0');
        const w = parseFloat(set.weight || '0');
        const r = parseFloat(set.reps || '0');
        const oneRM = w > 0 && r > 0 && r <= 12 ? Math.round(w * (1 + r / 30)) : null;

        return (
          <View key={si}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {/* Set number */}
              <View style={{ width: 28, alignItems: 'center' }}>
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800' }}>{si + 1}</Text>
              </View>

              {/* Reps */}
              <TextInput
                value={set.reps}
                onChangeText={v => onSetChange(index, si, 'reps', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#2A2A2A"
                style={{
                  flex: 1, backgroundColor: '#111', color: '#fff', borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 8, fontSize: 15, fontWeight: '700',
                  borderWidth: 1, borderColor: '#2A2A2A', textAlign: 'center', marginRight: 6,
                }}
              />

              {/* Weight */}
              <TextInput
                value={set.weight}
                onChangeText={v => onSetChange(index, si, 'weight', v)}
                keyboardType="numeric"
                placeholder={lastWeight ? `${lastWeight}` : '0'}
                placeholderTextColor={lastWeight && !set.weight ? '#4A4A4A' : '#2A2A2A'}
                style={{
                  flex: 1, backgroundColor: '#111', color: '#fff', borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 8, fontSize: 15, fontWeight: '700',
                  borderWidth: 1, borderColor: '#2A2A2A', textAlign: 'center', marginRight: 6,
                }}
              />

              {/* Set volume */}
              <Text style={{ color: setVol > 0 ? '#EF4444' : '#2A2A2A', fontSize: 11, fontWeight: '700', width: 40, textAlign: 'center' }}>
                {setVol > 0 ? fmtVol(setVol) : '—'}
              </Text>

              {/* Remove set */}
              <TouchableOpacity
                onPress={() => onRemoveSet(index, si)}
                disabled={entry.sets.length <= 1}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ width: 22, alignItems: 'center' }}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={16}
                  color={entry.sets.length > 1 ? '#3A3A3A' : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {/* 1RM hint inline */}
            {oneRM !== null && (
              <Text style={{ color: '#3A3A3A', fontSize: 9, marginBottom: 4, marginLeft: 28 }}>
                Est. 1RM: <Text style={{ color: '#F97316' }}>{oneRM}kg</Text>
              </Text>
            )}
          </View>
        );
      })}

      {/* Add Set */}
      <TouchableOpacity
        onPress={() => onAddSet(index)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          paddingVertical: 8, borderRadius: 8, marginTop: 6,
          borderWidth: 1, borderColor: '#2A2A2A', borderStyle: 'dashed',
        }}
      >
        <Ionicons name="add" size={14} color="#444" />
        <Text style={{ color: '#444', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Add Set</Text>
      </TouchableOpacity>

      {/* Exercise volume footer */}
      {exerciseVolume > 0 && (
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2A2A2A',
        }}>
          <Text style={{ color: '#444', fontSize: 11 }}>
            {entry.sets.filter(s => s.reps).length} set{entry.sets.filter(s => s.reps).length !== 1 ? 's' : ''} logged
          </Text>
          <Text style={{ color: '#555', fontSize: 12 }}>
            Exercise vol:{' '}
            <Text style={{ color: '#EF4444', fontWeight: '800' }}>{fmtVol(exerciseVolume)} kg</Text>
          </Text>
        </View>
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
  const [quickFilter, setQuickFilter] = useState<MuscleGroup>('all');
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

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

  // ── Entry handlers ──
  const handleChange = (i: number, field: Exclude<keyof ExEntry, 'sets'>, value: any) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const handleSetChange = (exIdx: number, setIdx: number, field: keyof SetEntry, value: string) => {
    setEntries(prev => prev.map((e, idx) => {
      if (idx !== exIdx) return e;
      const newSets = e.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s);
      return { ...e, sets: newSets };
    }));
  };

  const handleAddSet = (exIdx: number) => {
    setEntries(prev => prev.map((e, idx) => {
      if (idx !== exIdx) return e;
      const lastSet = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, { reps: '', weight: lastSet?.weight ?? '' }] };
    }));
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setEntries(prev => prev.map((e, idx) => {
      if (idx !== exIdx) return e;
      if (e.sets.length <= 1) return e;
      return { ...e, sets: e.sets.filter((_, si) => si !== setIdx) };
    }));
  };

  const handleRemove = (i: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    const valid = entries.filter(e => e.name && e.sets.some(s => s.reps));
    if (!valid.length) {
      Alert.alert('Missing info', 'Fill in at least one exercise with a name and reps.');
      return;
    }
    const names = valid.map(e => e.name.toLowerCase());
    const duplicate = names.find((n, i) => names.indexOf(n) !== i);
    if (duplicate) {
      Alert.alert('Duplicate exercise', `"${valid.find(e => e.name.toLowerCase() === duplicate)?.name}" appears more than once. Combine its sets into one entry.`);
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
            sets: e.sets
              .filter(s => s.reps)
              .map(s => ({
                reps: parseInt(s.reps) || 0,
                weight: parseFloat(s.weight) || 0,
              })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Cache the max weight used per exercise
      const newCache = { ...weightCache };
      valid.forEach(e => {
        const maxW = Math.max(...e.sets.map(s => parseFloat(s.weight) || 0));
        if (e.name && maxW > 0) newCache[e.name] = maxW;
      });
      setWeightCache(newCache);
      AsyncStorage.setItem(WEIGHT_CACHE_KEY, JSON.stringify(newCache)).catch(() => {});

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

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/workout-log/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setClearModalVisible(false);
      setShowPRBanner(false);
      setHistory([]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not clear data');
    } finally {
      setClearing(false);
    }
  };

  const handleQuickAdd = (preset: { name: string; muscleGroup: string }) => {
    const alreadyAdded = entries.some(e => e.name.toLowerCase() === preset.name.toLowerCase());
    if (alreadyAdded) return;
    const lastW = weightCache[preset.name];
    const newSets = lastW ? [{ reps: '', weight: String(lastW) }] : [emptySet()];
    // Fill the last empty-name entry, or append a new one
    const lastEmptyIdx = entries.map(e => e.name).lastIndexOf('');
    if (lastEmptyIdx !== -1) {
      setEntries(prev => prev.map((e, i) => i === lastEmptyIdx
        ? { ...e, name: preset.name, muscleGroup: preset.muscleGroup, sets: newSets, suggestions: [] }
        : e
      ));
    } else {
      setEntries(prev => [...prev, {
        name: preset.name, muscleGroup: preset.muscleGroup, sets: newSets, suggestions: [],
      }]);
    }
  };

  const color = MUSCLE_COLORS[selectedMuscle];

  // Total session volume preview
  const totalPreview = entries.reduce((sum, e) => {
    return sum + e.sets.reduce((s2, s) => {
      return s2 + (parseFloat(s.reps || '0') * parseFloat(s.weight || '0'));
    }, 0);
  }, 0);

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
          { label: 'Total Vol', value: fmtVol(totalVol), icon: 'barbell-outline' },
          { label: 'Best Session', value: fmtVol(maxVol), icon: 'trophy-outline' },
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
              {MUSCLE_LABELS[selectedMuscle]} Volume
            </Text>
            <TouchableOpacity
              onPress={() => setInfoModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="information-circle-outline" size={16} color="#444" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: '#444', fontSize: 11 }}>Last 30 days</Text>
            {history.length > 0 && (
              <TouchableOpacity
                onPress={() => setClearModalVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#3A3A3A" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {loading ? (
          <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={color} />
          </View>
        ) : (
          <VolumeLineChart data={chartData} color={color} />
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
                <Text style={{ color, fontSize: 13, fontWeight: '800' }}>
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

      {/* ── Clear Data Modal ── */}
      <Modal
        visible={clearModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setClearModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setClearModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{
            backgroundColor: '#1A1A1A', borderRadius: 18, padding: 28, width: '82%',
            alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A',
          }}>
            {/* Icon */}
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="trash-outline" size={30} color="#EF4444" />
            </View>

            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
              Clear All Data?
            </Text>
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              This will permanently delete your entire workout history and reset the chart. This cannot be undone.
            </Text>

            <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setClearModalVisible(false)}
                style={{
                  flex: 1, backgroundColor: '#2A2A2A', paddingVertical: 13,
                  borderRadius: 10, alignItems: 'center',
                }}
                activeOpacity={0.75}
              >
                <Text style={{ color: '#E0E0E0', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearAll}
                disabled={clearing}
                style={{
                  flex: 1, backgroundColor: '#EF4444', paddingVertical: 13,
                  borderRadius: 10, alignItems: 'center', opacity: clearing ? 0.7 : 1,
                }}
                activeOpacity={0.75}
              >
                {clearing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>Clear All</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Info Modal ── */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          activeOpacity={1}
          onPress={() => setInfoModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#1C1E20', borderRadius: 16, padding: 24, width: '100%', borderWidth: 1, borderColor: '#2A2A2A' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 }}>How Volume Is Tracked</Text>

            <Text style={{ color: '#aaa', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ color: '#EF4444', fontWeight: '700' }}>Volume</Text> measures total work done per session:
            </Text>

            <View style={{ backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#ccc', fontSize: 12, fontFamily: 'monospace', lineHeight: 20 }}>
                Set Volume   = weight × reps{'\n'}
                Exercise Vol = Σ set volumes{'\n'}
                Session Vol  = Σ exercise volumes
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ color: '#EF4444', fontSize: 13 }}>•</Text>
                <Text style={{ color: '#aaa', fontSize: 13, lineHeight: 18, flex: 1 }}>
                  <Text style={{ color: '#ddd', fontWeight: '600' }}>Tap a dot</Text> on the chart to see the exact session volume.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ color: '#EF4444', fontSize: 13 }}>•</Text>
                <Text style={{ color: '#aaa', fontSize: 13, lineHeight: 18, flex: 1 }}>
                  <Text style={{ color: '#ddd', fontWeight: '600' }}>Swipe left</Text> on the chart to scroll back through older sessions.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ color: '#EF4444', fontSize: 13 }}>•</Text>
                <Text style={{ color: '#aaa', fontSize: 13, lineHeight: 18, flex: 1 }}>
                  Use the <Text style={{ color: '#ddd', fontWeight: '600' }}>muscle filter</Text> tabs to view volume for a specific muscle group.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ color: '#EF4444', fontSize: 13 }}>•</Text>
                <Text style={{ color: '#aaa', fontSize: 13, lineHeight: 18, flex: 1 }}>
                  The chart shows your <Text style={{ color: '#ddd', fontWeight: '600' }}>last 30 days</Text> of logged sessions.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setInfoModalVisible(false)}
              style={{ marginTop: 20, backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 11, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Log Workout Modal ── */}
      <Modal visible={logVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLogVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: '#1C1E20' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal header */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Log Workout</Text>
            <TouchableOpacity onPress={() => { setLogVisible(false); setEntries([emptyEntry()]); setQuickFilter('all'); }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: '#444', fontSize: 11, marginBottom: 16 }}>
              Volume per set = Weight × Reps. Exercise volume = sum of all sets.
            </Text>

            {/* ── Quick Add ── */}
            <View style={{
              backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 20,
              borderWidth: 1, borderColor: '#1E1E1E',
            }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 12 }}>
                Quick Add Exercise
              </Text>

              {/* Muscle filter tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {MUSCLE_GROUPS.map(m => {
                  const active = quickFilter === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setQuickFilter(m)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 6,
                        backgroundColor: active ? MUSCLE_COLORS[m] : '#1A1A1A',
                        borderWidth: 1, borderColor: active ? MUSCLE_COLORS[m] : '#2A2A2A',
                      }}
                    >
                      <Text style={{ color: active ? '#fff' : '#555', fontSize: 11, fontWeight: '700' }}>
                        {MUSCLE_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Exercise chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_EXERCISES
                  .filter(p => quickFilter === 'all' || p.muscleGroup === quickFilter)
                  .map((preset, i) => {
                    const added = entries.some(e => e.name.toLowerCase() === preset.name.toLowerCase());
                    const mc = MUSCLE_COLORS[preset.muscleGroup as MuscleGroup];
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleQuickAdd(preset)}
                        disabled={added}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 5,
                          paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                          backgroundColor: added ? '#1A1A1A' : mc + '18',
                          borderWidth: 1, borderColor: added ? '#222' : mc + '55',
                        }}
                        activeOpacity={0.7}
                      >
                        {added && (
                          <Ionicons name="checkmark-circle" size={12} color="#3A3A3A" />
                        )}
                        <Text style={{ color: added ? '#333' : mc, fontSize: 12, fontWeight: '600' }}>
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                }
              </View>
            </View>

            {/* ── Exercise rows ── */}
            {entries.map((entry, i) => (
              <ExerciseRow
                key={i}
                entry={entry}
                index={i}
                existingNames={entries
                  .filter((_, idx) => idx !== i)
                  .map(e => e.name.toLowerCase())
                  .filter(Boolean)}
                onChange={handleChange}
                onSetChange={handleSetChange}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
                onRemove={handleRemove}
                weightCache={weightCache}
              />
            ))}

            {/* Add exercise */}
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

            {/* Session volume preview */}
            {totalPreview > 0 && (
              <View style={{
                backgroundColor: '#EF444411', borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: '#EF444433', marginBottom: 16,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text style={{ color: '#888', fontSize: 13 }}>Session volume</Text>
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '800' }}>
                  {fmtVol(totalPreview)} kg
                </Text>
              </View>
            )}

            {/* Save button */}
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
