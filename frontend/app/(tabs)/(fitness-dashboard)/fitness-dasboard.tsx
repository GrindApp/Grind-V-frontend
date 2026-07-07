import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeJWT } from '@/utils/jwt';
import VolumeTracker from '@/app/components/lore/VolumeTracker';
import StepCounter from '@/app/components/homepage/StepCounter';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  fitnessLevel: string;
  goal: string;
  workoutDaysPerWeek: number;
  sessionDuration: number;
  workoutLocation: string;
  equipmentAvailable: string[];
  injuriesOrConditions: string[];
  height: string;
  weight: string;
};

const INITIAL_FORM: FormData = {
  fitnessLevel: '',
  goal: '',
  workoutDaysPerWeek: 4,
  sessionDuration: 45,
  workoutLocation: '',
  equipmentAvailable: [],
  injuriesOrConditions: [],
  height: '',
  weight: '',
};

// ─── Options ──────────────────────────────────────────────────────────────────
const LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: 'leaf-outline', desc: 'New to working out' },
  { id: 'intermediate', label: 'Intermediate', icon: 'barbell-outline', desc: '1–3 years experience' },
  { id: 'advanced', label: 'Advanced', icon: 'flame-outline', desc: '3+ years experience' },
];

const GOALS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down-outline' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: 'body-outline' },
  { id: 'strength', label: 'Strength', icon: 'barbell-outline' },
  { id: 'endurance', label: 'Endurance', icon: 'bicycle-outline' },
  { id: 'flexibility', label: 'Flexibility', icon: 'accessibility-outline' },
  { id: 'general_fitness', label: 'General Fitness', icon: 'fitness-outline' },
];

const LOCATIONS = [
  { id: 'gym', label: 'Gym', icon: 'business-outline' },
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'outdoor', label: 'Outdoor', icon: 'leaf-outline' },
];

const EQUIPMENT = ['Dumbbells', 'Barbell', 'Resistance Band', 'Kettlebell', 'Pull-up Bar', 'Bench', 'Cable Machine', 'Bodyweight Only'];

const INJURIES = ['Lower Back Pain', 'Knee Pain', 'Shoulder Injury', 'Wrist Pain', 'Hip Pain', 'Neck Pain', 'Asthma', 'Heart Condition'];

const DAY_OPTIONS = [3, 4, 5, 6];
const DURATION_OPTIONS = [30, 45, 60, 90];

// ─── Small helpers ─────────────────────────────────────────────────────────────
const goalLabel = (g: string) => GOALS.find(x => x.id === g)?.label ?? g;
const levelLabel = (l: string) => LEVELS.find(x => x.id === l)?.label ?? l;


// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected && styles.chipSelected]}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function LorePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'volume'>('plan');
  const [loading, setLoading] = useState(true);

  // Form state
  const [step, setStep] = useState(0); // 0=level, 1=goal, 2=schedule, 3=location, 4=health, 5=plans
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [templates, setTemplates] = useState<any[]>([]);
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  // Load user + check for existing plan
  useEffect(() => {
    const init = async () => {
      try {
        const t = await AsyncStorage.getItem('authToken');
        if (!t) return;
        setToken(t);
        const decoded: any = decodeJWT(t);
        const uid = decoded?.id;
        setUserId(uid);

        const res = await fetch(`${API_URL}/api/v1/workout-plan/${uid}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        const plans = data.data ?? [];
        if (plans.length > 0) setActivePlan(plans[0]);
      } catch (e) {
        console.error('Error loading lore:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchTemplates = useCallback(async () => {
    setFetchingPlans(true);
    try {
      const params = new URLSearchParams();
      if (form.fitnessLevel) params.set('fitnessLevel', form.fitnessLevel);
      if (form.goal) params.set('goal', form.goal);
      const res = await fetch(`${API_URL}/api/v1/workout-plan/templates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTemplates(data.data ?? []);
    } catch (e) {
      console.error('Error fetching templates:', e);
    } finally {
      setFetchingPlans(false);
    }
  }, [form.fitnessLevel, form.goal, token]);

  const subscribe = async (templateId: string) => {
    setSubscribing(templateId);
    try {
      const res = await fetch(`${API_URL}/api/v1/workout-plan/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          templateId,
          workoutLocation: form.workoutLocation,
          injuriesOrConditions: form.injuriesOrConditions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setActivePlan(data.data);
      setShowForm(false);
      setStep(0);
      setForm(INITIAL_FORM);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not subscribe to plan');
    } finally {
      setSubscribing(null);
    }
  };

  const nextStep = () => {
    if (step === 4) { fetchTemplates(); }
    setStep(s => s + 1);
  };

  const canProceed = () => {
    if (step === 0) return !!form.fitnessLevel;
    if (step === 1) return !!form.goal;
    if (step === 3) return !!form.workoutLocation;
    return true;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><ActivityIndicator color="#EF4444" size="large" /></View>
      </SafeAreaView>
    );
  }

  // ── Active plan view with Volume tab ─────────────────────────────────────
  if (activePlan && !showForm) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tab bar */}
      <View style={tabStyles.bar}>
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'plan' && tabStyles.tabActive]}
          onPress={() => setActiveTab('plan')}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={14} color={activeTab === 'plan' ? '#fff' : '#555'} />
          <Text style={[tabStyles.tabText, activeTab === 'plan' && tabStyles.tabTextActive]}>My Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'volume' && tabStyles.tabActive]}
          onPress={() => setActiveTab('volume')}
          activeOpacity={0.8}
        >
          <Ionicons name="bar-chart-outline" size={14} color={activeTab === 'volume' ? '#fff' : '#555'} />
          <Text style={[tabStyles.tabText, activeTab === 'volume' && tabStyles.tabTextActive]}>Volume</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'plan' ? (
        <ActivePlanView
          plan={activePlan}
          onReset={() => {
            setStep(0);
            setForm(INITIAL_FORM);
            setTemplates([]);
            setShowForm(true);
          }}
        />
      ) : (
        <VolumeTracker userId={userId!} token={token!} />
      )}
    </SafeAreaView>
  );

  // ── Form wizard ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : activePlan ? (
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Lore</Text>
          <Text style={styles.headerSub}>
            {activePlan ? 'Choose a new plan' : 'Build your fitness identity'}
          </Text>
        </View>
        <Text style={styles.stepIndicator}>{step + 1} / 6</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / 6) * 100}%` }]} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Step 0 — Fitness Level */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>What's your fitness level?</Text>
            <Text style={styles.stepSub}>We'll tailor your plan to match your experience.</Text>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.optionCard, form.fitnessLevel === l.id && styles.optionCardSelected]}
                onPress={() => setForm(f => ({ ...f, fitnessLevel: l.id }))}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, form.fitnessLevel === l.id && styles.optionIconSelected]}>
                  <Ionicons name={l.icon as any} size={22} color={form.fitnessLevel === l.id ? '#fff' : '#EF4444'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{l.label}</Text>
                  <Text style={styles.optionDesc}>{l.desc}</Text>
                </View>
                {form.fitnessLevel === l.id && <Ionicons name="checkmark-circle" size={22} color="#EF4444" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 1 — Goal */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSub}>Choose what you want to achieve.</Text>
            <View style={styles.goalGrid}>
              {GOALS.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalCard, form.goal === g.id && styles.goalCardSelected]}
                  onPress={() => setForm(f => ({ ...f, goal: g.id }))}
                  activeOpacity={0.8}
                >
                  <Ionicons name={g.icon as any} size={26} color={form.goal === g.id ? '#EF4444' : '#555'} />
                  <Text style={[styles.goalLabel, form.goal === g.id && { color: '#EF4444' }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2 — Schedule */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Your schedule</Text>
            <Text style={styles.stepSub}>How often and how long do you want to train?</Text>

            <Text style={styles.sectionLabel}>Days per week</Text>
            <View style={styles.pillRow}>
              {DAY_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, form.workoutDaysPerWeek === d && styles.pillSelected]}
                  onPress={() => setForm(f => ({ ...f, workoutDaysPerWeek: d }))}
                >
                  <Text style={[styles.pillText, form.workoutDaysPerWeek === d && styles.pillTextSelected]}>{d}x</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Session duration</Text>
            <View style={styles.pillRow}>
              {DURATION_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, form.sessionDuration === d && styles.pillSelected]}
                  onPress={() => setForm(f => ({ ...f, sessionDuration: d }))}
                >
                  <Text style={[styles.pillText, form.sessionDuration === d && styles.pillTextSelected]}>{d} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3 — Location & Equipment */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Where do you train?</Text>
            <Text style={styles.stepSub}>We'll match equipment-appropriate exercises.</Text>

            <View style={styles.locRow}>
              {LOCATIONS.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.locCard, form.workoutLocation === l.id && styles.locCardSelected]}
                  onPress={() => setForm(f => ({ ...f, workoutLocation: l.id }))}
                  activeOpacity={0.8}
                >
                  <Ionicons name={l.icon as any} size={28} color={form.workoutLocation === l.id ? '#EF4444' : '#555'} />
                  <Text style={[styles.locLabel, form.workoutLocation === l.id && { color: '#EF4444' }]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Equipment available</Text>
            <View style={styles.chipWrap}>
              {EQUIPMENT.map(e => (
                <Chip
                  key={e} label={e}
                  selected={form.equipmentAvailable.includes(e)}
                  onPress={() => setForm(f => ({
                    ...f,
                    equipmentAvailable: f.equipmentAvailable.includes(e)
                      ? f.equipmentAvailable.filter(x => x !== e)
                      : [...f.equipmentAvailable, e],
                  }))}
                />
              ))}
            </View>
          </View>
        )}

        {/* Step 4 — Health */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Health & body info</Text>
            <Text style={styles.stepSub}>This helps us avoid exercises that could hurt you.</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={form.height}
                  onChangeText={v => setForm(f => ({ ...f, height: v }))}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor="#555"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={form.weight}
                  onChangeText={v => setForm(f => ({ ...f, weight: v }))}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor="#555"
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Any injuries or conditions?</Text>
            <Text style={styles.stepSub}>Select all that apply.</Text>
            <View style={styles.chipWrap}>
              {INJURIES.map(inj => (
                <Chip
                  key={inj} label={inj}
                  selected={form.injuriesOrConditions.includes(inj)}
                  onPress={() => setForm(f => ({
                    ...f,
                    injuriesOrConditions: f.injuriesOrConditions.includes(inj)
                      ? f.injuriesOrConditions.filter(x => x !== inj)
                      : [...f.injuriesOrConditions, inj],
                  }))}
                />
              ))}
            </View>
          </View>
        )}

        {/* Step 5 — Plans */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Recommended plans</Text>
            <Text style={styles.stepSub}>
              {levelLabel(form.fitnessLevel)} · {goalLabel(form.goal)} · {form.workoutDaysPerWeek}x/week
            </Text>

            {fetchingPlans ? (
              <View style={styles.centered}><ActivityIndicator color="#EF4444" /></View>
            ) : templates.length === 0 ? (
              <View style={[styles.centered, { marginTop: 40 }]}>
                <Ionicons name="search-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>No plans found for your profile.</Text>
                <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>
                  Ask your trainer to add templates to the database.
                </Text>
              </View>
            ) : (
              templates.map(plan => (
                <View key={plan._id} style={styles.planCard}>
                  <View style={styles.planCardHeader}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.planCardTitle}>{plan.name}</Text>
                      <Text style={styles.planCardMeta}>
                        {levelLabel(plan.fitnessLevel)} · {plan.workoutDaysPerWeek}x/week · {plan.sessionDuration} min
                      </Text>
                    </View>
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.workoutLocation}</Text>
                    </View>
                  </View>

                  {/* Goals tags */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {(plan.goals ?? []).map((g: string) => (
                      <View key={g} style={styles.goalTag}>
                        <Text style={styles.goalTagText}>{goalLabel(g)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Plan summary */}
                  <View style={styles.planDay}>
                    <Text style={styles.planDayName}>Duration</Text>
                    <Text style={styles.planDayFocus}>{plan.durationWeeks} weeks</Text>
                  </View>
                  {plan.description ? (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.subscribeBtn, subscribing === plan._id && { opacity: 0.7 }]}
                    onPress={() => subscribe(plan._id)}
                    disabled={!!subscribing}
                    activeOpacity={0.8}
                  >
                    {subscribing === plan._id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.subscribeBtnText}>Subscribe to this plan</Text>
                    }
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Next button */}
      {step < 5 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            onPress={nextStep}
            disabled={!canProceed()}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{step === 4 ? 'Find my plan' : 'Continue'}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Active Plan View ──────────────────────────────────────────────────────────
// activePlan shape: { currentWeek, currentDay, plan: WorkoutCatalog }
function ActivePlanView({ plan: userPlan, onReset }: { plan: any; onReset: () => void }) {
  const catalog = userPlan.plan ?? {};
  const currentWeek = userPlan.currentWeek ?? 1;

  // Map today's weekday → day number (Mon=1 … Sun=7), clamped to plan's days/week
  const todayDayNum = (() => {
    const d = new Date().getDay(); // 0=Sun,1=Mon…6=Sat
    const monBased = d === 0 ? 7 : d; // Mon=1…Sun=7
    return Math.min(monBased, catalog.workoutDaysPerWeek ?? monBased);
  })();
  const currentDay = userPlan.currentDay && userPlan.currentDay > 1
    ? userPlan.currentDay
    : todayDayNum;

  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([currentWeek]));

  const toggleWeek = (n: number) => {
    setOpenWeeks(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  // Current day's workout from the catalog weeks array
  const weekData = catalog.weeks?.find((w: any) => w.weekNumber === currentWeek)
    ?? catalog.weeks?.[0];
  const todayData = weekData?.days?.find((d: any) => d.dayNumber === currentDay)
    ?? weekData?.days?.find((d: any) => d.dayNumber === todayDayNum)
    ?? weekData?.days?.[0];

  // All days in the current week for the weekly row
  const currentWeekDays: any[] = weekData?.days ?? [];

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={[styles.header, { paddingBottom: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Lore</Text>
            <Text style={styles.headerSub}>{catalog.name}</Text>
          </View>
          <TouchableOpacity onPress={onReset} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change plan</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Days/week', value: `${catalog.workoutDaysPerWeek ?? '—'}x` },
            { label: 'Session', value: `${catalog.sessionDuration ?? '—'}m` },
            { label: 'Location', value: catalog.workoutLocation ?? '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Step counter */}
        <StepCounter />

        {/* Progress badge */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <View style={styles.progressBadge}>
            <Ionicons name="calendar-outline" size={14} color="#EF4444" />
            <Text style={styles.progressBadgeText}>
              Week {currentWeek} of {catalog.durationWeeks ?? '?'} · Day {currentDay}
            </Text>
          </View>
        </View>

        {/* Today's workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {todayData?.isRestDay ? 'Today — Rest Day' : `Today — ${todayData?.focus ?? 'Workout'}`}
          </Text>
          {todayData && !todayData.isRestDay ? (
            <>
              <View style={styles.focusBadge}>
                <Ionicons name="flame-outline" size={14} color="#EF4444" />
                <Text style={styles.focusBadgeText}>{todayData.focus}</Text>
              </View>
              {(todayData.exercises ?? []).map((ex: any, i: number) => (
                <View key={i} style={styles.exerciseRow}>
                  <View style={styles.exerciseNum}>
                    <Text style={styles.exerciseNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {ex.sets ? `${ex.sets} sets` : ''}
                      {ex.reps ? ` · ${ex.reps} reps` : ''}
                      {ex.duration ? ` · ${ex.duration}` : ''}
                    </Text>
                    {ex.description ? <Text style={styles.exerciseDesc}>{ex.description}</Text> : null}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.restDay}>
              <Ionicons name="moon-outline" size={32} color="#333" />
              <Text style={styles.restDayText}>Rest day — recover & recharge</Text>
            </View>
          )}
        </View>

        {/* Weekly overview — show current week days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Week {currentWeek} overview</Text>
          <View style={styles.weekGrid}>
            {currentWeekDays.map((day: any) => {
              const isActive = day.dayNumber === currentDay;
              return (
                <View key={day.dayNumber} style={[styles.weekDayCard, isActive && styles.weekDayCardActive]}>
                  <Text style={[styles.weekDayCardNum, isActive && { color: '#EF4444' }]}>Day {day.dayNumber}</Text>
                  <Text style={[styles.weekDayCardFocus, isActive && { color: '#fff' }]} numberOfLines={1}>
                    {day.isRestDay ? 'Rest' : day.focus}
                  </Text>
                  {isActive && <View style={styles.weekDayActiveDot} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Full plan — collapsible week accordions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full program</Text>
          {(catalog.weeks ?? []).map((week: any) => {
            const isOpen = openWeeks.has(week.weekNumber);
            const dayCount = (week.days ?? []).length;
            const isCurrent = week.weekNumber === currentWeek;
            return (
              <View key={week.weekNumber} style={styles.weekAccordion}>
                <TouchableOpacity
                  onPress={() => toggleWeek(week.weekNumber)}
                  activeOpacity={0.75}
                  style={styles.weekAccordionHeader}
                >
                  <View style={styles.weekAccordionLeft}>
                    <View style={[styles.weekNumBadge, isCurrent && { backgroundColor: '#EF4444' }]}>
                      <Text style={styles.weekNumText}>{week.weekNumber}</Text>
                    </View>
                    <View>
                      <Text style={styles.weekAccordionTitle}>
                        Week {week.weekNumber}
                        {isCurrent ? '  ·  Current' : ''}
                      </Text>
                      <Text style={styles.weekAccordionSub}>{dayCount} days</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isOpen ? '#EF4444' : '#444'}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.weekAccordionBody}>
                    {(week.days ?? []).map((day: any) => (
                      <View key={day.dayNumber} style={styles.fullDayCard}>
                        <View style={styles.fullDayHeader}>
                          <Text style={styles.fullDayName}>Day {day.dayNumber}</Text>
                          <Text style={styles.fullDayFocus}>{day.isRestDay ? 'Rest' : day.focus}</Text>
                        </View>
                        {!day.isRestDay && (day.exercises ?? []).map((ex: any, j: number) => (
                          <Text key={j} style={styles.fullDayExercise}>
                            • {ex.name}{ex.sets ? `  ${ex.sets}×${ex.reps}` : ''}{ex.duration ? `  ${ex.duration}` : ''}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1E20' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#666', fontSize: 13, marginTop: 2 },
  stepIndicator: { color: '#555', fontSize: 13 },

  progressTrack: { height: 3, backgroundColor: '#1A1A1A', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#EF4444', borderRadius: 2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 },

  stepTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  stepSub: { color: '#666', fontSize: 14, marginBottom: 24 },
  sectionLabel: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyText: { color: '#555', fontSize: 14, marginTop: 12, textAlign: 'center' },

  // Option card (level)
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  optionCardSelected: { borderColor: '#EF4444' },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  optionIconSelected: { backgroundColor: '#EF4444' },
  optionLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  optionDesc: { color: '#666', fontSize: 13, marginTop: 2 },

  // Goal grid
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: { width: '47%', backgroundColor: '#111', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222', gap: 10 },
  goalCardSelected: { borderColor: '#EF4444', backgroundColor: '#1A0A0A' },
  goalLabel: { color: '#888', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Pills
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  pillSelected: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  pillText: { color: '#666', fontWeight: '600' },
  pillTextSelected: { color: '#fff' },

  // Location
  locRow: { flexDirection: 'row', gap: 10 },
  locCard: { flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222', gap: 8 },
  locCardSelected: { borderColor: '#EF4444', backgroundColor: '#1A0A0A' },
  locLabel: { color: '#888', fontSize: 13, fontWeight: '600' },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  chipSelected: { backgroundColor: '#EF444422', borderColor: '#EF4444' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextSelected: { color: '#EF4444' },

  // Inputs
  inputRow: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  inputLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222', color: '#fff', fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },

  // Plan cards
  planCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planCardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  planCardMeta: { color: '#666', fontSize: 13, marginTop: 4 },
  planBadge: { backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  planBadgeText: { color: '#EF4444', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  planDay: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1A1A1A' },
  planDayName: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  planDayFocus: { color: '#555', fontSize: 13 },
  planMore: { color: '#555', fontSize: 12, marginTop: 8, textAlign: 'center' },
  subscribeBtn: { backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  subscribeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Footer
  footer: { padding: 20, paddingBottom: 32, backgroundColor: '#1C1E20', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2A2A2A' },
  nextBtn: { backgroundColor: '#EF4444', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#2A2A2A' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Active plan view
  changeBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  changeBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 4 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  focusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  focusBadgeText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },

  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8 },
  exerciseNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EF444422', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  exerciseNumText: { color: '#EF4444', fontSize: 13, fontWeight: '800' },
  exerciseName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  exerciseMeta: { color: '#555', fontSize: 12, marginTop: 3 },

  restDay: { alignItems: 'center', padding: 32, gap: 12, backgroundColor: '#111', borderRadius: 16 },
  restDayText: { color: '#555', fontSize: 14 },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', borderRadius: 16, padding: 14 },
  weekDay: { alignItems: 'center', flex: 1, gap: 8, position: 'relative' },
  weekDayToday: {},
  weekDayName: { color: '#555', fontSize: 11, fontWeight: '600' },
  weekDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  weekDotActive: { backgroundColor: '#EF4444' },
  weekDotRest: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1A1A' },
  weekTodayLine: { position: 'absolute', bottom: -14, width: 4, height: 4, borderRadius: 2, backgroundColor: '#EF4444' },

  fullDayCard: { backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10 },
  fullDayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fullDayName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  fullDayFocus: { color: '#EF4444', fontSize: 13 },
  fullDayExercise: { color: '#666', fontSize: 13, marginTop: 3 },

  // Goal tags on plan cards
  goalTag: { backgroundColor: '#EF444422', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#EF444444' },
  goalTagText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  planDescription: { color: '#666', fontSize: 13, marginTop: 8, lineHeight: 18 },

  // Active plan progress badge
  progressBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EF444422', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EF444444' },
  progressBadgeText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  exerciseDesc: { color: '#444', fontSize: 12, marginTop: 2 },

  // Week grid in active plan view
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weekDayCard: { width: '30%', backgroundColor: '#111', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  weekDayCardActive: { borderColor: '#EF4444', backgroundColor: '#1A0A0A' },
  weekDayCardNum: { color: '#555', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  weekDayCardFocus: { color: '#666', fontSize: 12, textAlign: 'center' },
  weekDayActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginTop: 6 },

  weekLabel: { color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Week accordion
  weekAccordion: { backgroundColor: '#111', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#222', overflow: 'hidden' },
  weekAccordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  weekAccordionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weekNumBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  weekNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  weekAccordionTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  weekAccordionSub: { color: '#555', fontSize: 11, marginTop: 2 },
  weekAccordionBody: { borderTopWidth: 1, borderTopColor: '#1A1A1A', padding: 10 },
});

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 9,
  },
  tabActive: { backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430' },
  tabText: { color: '#555', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#EF4444' },
});
