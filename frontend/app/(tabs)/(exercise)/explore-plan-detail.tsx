import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ImageBackground, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#22C55E',
  Intermediate: '#EAB308',
  Advanced: '#EF4444',
};

type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
};

type DaySchedule = {
  day: string;
  focus: string;
  exercises: Exercise[];
};

type Plan = {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  daysPerWeek: number;
  imageUrl: string;
  tags: string[];
  schedule: DaySchedule[];
  isSaved: boolean;
  savedCount: number;
};

export default function ExplorePlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/v1/explore-workouts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setPlan(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/api/v1/explore-workouts/${plan._id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPlan(prev => prev ? { ...prev, isSaved: json.isSaved, savedCount: json.savedCount } : prev);
      }
    } catch (err) {
      console.error('Failed to save plan:', err);
    } finally {
      setSaving(false);
    }
  }, [plan]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={s.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Plan not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const diffColor = DIFF_COLOR[plan.difficulty] ?? '#888';
  const totalExercises = plan.schedule.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero Image */}
        <ImageBackground
          source={{ uri: plan.imageUrl || 'https://picsum.photos/id/1016/1600/900' }}
          style={s.hero}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar */}
          <View style={s.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={s.iconBtn} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Heart size={20} color={plan.isSaved ? '#EF4444' : '#fff'} fill={plan.isSaved ? '#EF4444' : 'none'} />
              }
            </TouchableOpacity>
          </View>

          {/* Hero text */}
          <View style={s.heroBottom}>
            <View style={s.badgeRow}>
              <View style={[s.badge, { backgroundColor: diffColor + '33' }]}>
                <Text style={[s.badgeText, { color: diffColor }]}>{plan.difficulty}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={[s.badgeText, { color: '#ddd' }]}>{plan.category}</Text>
              </View>
            </View>
            <Text style={s.heroTitle}>{plan.title}</Text>
            <Text style={s.heroDesc}>{plan.description}</Text>
          </View>
        </ImageBackground>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { icon: 'calendar-outline', label: 'Duration', value: `${plan.durationWeeks} weeks` },
            { icon: 'flame-outline', label: 'Days / week', value: `${plan.daysPerWeek} days` },
            { icon: 'barbell-outline', label: 'Exercises', value: `${totalExercises} total` },
            { icon: 'heart-outline', label: 'Saved by', value: `${plan.savedCount}` },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Ionicons name={item.icon as any} size={20} color="#EF4444" />
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Tags */}
        {plan.tags.length > 0 && (
          <View style={s.section}>
            <View style={s.tagRow}>
              {plan.tags.map(tag => (
                <View key={tag} style={s.tag}>
                  <Text style={s.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Schedule — grouped by week */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Weekly Schedule</Text>
          <Text style={s.sectionSub}>Tap a week to expand, then a day to see exercises</Text>

          {Array.from({ length: plan.durationWeeks }).map((_, weekIdx) => {
            const dpw = plan.daysPerWeek;
            const weekDays = plan.schedule.slice(weekIdx * dpw, (weekIdx + 1) * dpw);
            if (weekDays.length === 0) return null;
            const isWeekOpen = openWeeks.has(weekIdx);
            const totalEx = weekDays.reduce((sum, d) => sum + d.exercises.length, 0);

            return (
              <View key={weekIdx} style={s.weekCard}>
                {/* Week header — tap to collapse/expand */}
                <TouchableOpacity
                  onPress={() => {
                    setOpenWeeks(prev => {
                      const next = new Set(prev);
                      next.has(weekIdx) ? next.delete(weekIdx) : next.add(weekIdx);
                      return next;
                    });
                  }}
                  activeOpacity={0.75}
                  style={s.weekHeader}
                >
                  <View style={s.weekHeaderLeft}>
                    <View style={[s.weekBadge, isWeekOpen && { backgroundColor: '#EF4444' }]}>
                      <Text style={s.weekBadgeText}>{weekIdx + 1}</Text>
                    </View>
                    <View>
                      <Text style={s.weekTitle}>Week {weekIdx + 1}</Text>
                      <Text style={s.weekSub}>{weekDays.length} days · {totalEx} exercises</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isWeekOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isWeekOpen ? '#EF4444' : '#555'}
                  />
                </TouchableOpacity>

                {/* Days inside week */}
                {isWeekOpen && (
                  <View style={s.weekBody}>
                    {weekDays.map((dayPlan, di) => {
                      const globalIdx = weekIdx * dpw + di;
                      const isDayOpen = expandedDay === globalIdx;
                      return (
                        <View key={di} style={[s.dayCard, di === weekDays.length - 1 && { marginBottom: 0 }]}>
                          <TouchableOpacity
                            onPress={() => setExpandedDay(isDayOpen ? null : globalIdx)}
                            activeOpacity={0.75}
                            style={s.dayHeader}
                          >
                            <View style={s.dayLeft}>
                              <View style={[s.dayNum, isDayOpen && { backgroundColor: '#EF4444' }]}>
                                <Text style={s.dayNumText}>{di + 1}</Text>
                              </View>
                              <View>
                                <Text style={s.dayName}>{dayPlan.day}</Text>
                                <Text style={s.dayFocus}>{dayPlan.focus}</Text>
                              </View>
                            </View>
                            <View style={s.dayRight}>
                              <Text style={s.dayExCount}>{dayPlan.exercises.length} ex</Text>
                              <Ionicons
                                name={isDayOpen ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color="#555"
                              />
                            </View>
                          </TouchableOpacity>

                          {isDayOpen && (
                            <View style={s.exerciseList}>
                              {dayPlan.exercises.map((ex, ei) => (
                                <View
                                  key={ei}
                                  style={[s.exRow, ei < dayPlan.exercises.length - 1 && s.exDivider]}
                                >
                                  <View style={s.exNum}>
                                    <Text style={s.exNumText}>{ei + 1}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={s.exName}>{ex.name}</Text>
                                    <Text style={s.exMeta}>
                                      {ex.sets} sets · {ex.reps} reps
                                      {ex.rest && ex.rest !== '—' ? ` · Rest ${ex.rest}` : ''}
                                    </Text>
                                    {ex.notes ? <Text style={s.exNote}>{ex.notes}</Text> : null}
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity
            style={[s.ctaBtn, plan.isSaved && s.ctaBtnActive]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Heart size={18} color="#fff" fill={plan.isSaved ? '#fff' : 'none'} />
                  <Text style={s.ctaText}>
                    {plan.isSaved ? 'Remove from Ongoing' : 'Start this Plan'}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0B0D' },

  hero: { height: 300, justifyContent: 'space-between' },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12,
  },
  heroBottom: { paddingHorizontal: 16, paddingBottom: 20 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  heroDesc: { color: '#bbb', fontSize: 13, lineHeight: 19 },

  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  statCard: {
    flex: 1, backgroundColor: '#111318', borderRadius: 14,
    alignItems: 'center', paddingVertical: 12, gap: 4,
    borderWidth: 1, borderColor: '#1E2124',
  },
  statValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 10 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  sectionSub: { color: '#555', fontSize: 12, marginBottom: 14 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#1A1C20', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#252830',
  },
  tagText: { color: '#888', fontSize: 12 },

  // Week accordion
  weekCard: {
    backgroundColor: '#111318', borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#1E2124', overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  weekHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weekBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#1A1C20', alignItems: 'center', justifyContent: 'center',
  },
  weekBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  weekTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  weekSub: { color: '#555', fontSize: 11, marginTop: 2 },
  weekBody: {
    borderTopWidth: 1, borderTopColor: '#1A1C20',
    padding: 10,
  },

  // Day cards (nested inside week)
  dayCard: {
    backgroundColor: '#0E1014', borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#1A1C20', overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 12,
  },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayNum: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#1A1C20',
    alignItems: 'center', justifyContent: 'center',
  },
  dayNumText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  dayName: { color: '#E5E7EB', fontSize: 13, fontWeight: '700' },
  dayFocus: { color: '#555', fontSize: 11, marginTop: 1 },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayExCount: { color: '#555', fontSize: 12 },

  exerciseList: {
    borderTopWidth: 1, borderTopColor: '#1A1C20',
    paddingHorizontal: 14, paddingBottom: 4,
  },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
  exDivider: { borderBottomWidth: 1, borderBottomColor: '#1A1C20' },
  exNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#EF444418', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  exNumText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  exName: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  exMeta: { color: '#555', fontSize: 11, marginTop: 3 },
  exNote: { color: '#666', fontSize: 11, marginTop: 2, fontStyle: 'italic' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#EF4444', borderRadius: 16, paddingVertical: 16,
  },
  ctaBtnActive: { backgroundColor: '#374151' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
