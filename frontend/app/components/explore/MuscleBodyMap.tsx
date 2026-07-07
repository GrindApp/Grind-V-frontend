import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
  Dimensions, StyleSheet,
} from 'react-native';
import Svg, { Ellipse, Path, Rect, G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_W = Dimensions.get('window').width;

// SVG coordinate space
const VB_W = 200;
const VB_H = 390;
const SVG_W = Math.round(SCREEN_W * 0.52);
const SVG_H = Math.round(SVG_W * (VB_H / VB_W));

// ─── Muscle definitions ───────────────────────────────────────────────────────

type MuscleId =
  | 'chest' | 'shoulders' | 'biceps' | 'forearms' | 'abs' | 'quads' | 'calves'
  | 'traps' | 'lats' | 'triceps' | 'lower_back' | 'glutes' | 'hamstrings' | 'calves_back';

type MuscleInfo = { id: MuscleId; label: string; view: 'front' | 'back'; color: string };

const MUSCLES: MuscleInfo[] = [
  { id: 'chest',      label: 'Chest',       view: 'front', color: '#EF4444' },
  { id: 'shoulders',  label: 'Shoulders',   view: 'front', color: '#F97316' },
  { id: 'biceps',     label: 'Biceps',      view: 'front', color: '#EAB308' },
  { id: 'forearms',   label: 'Forearms',    view: 'front', color: '#84CC16' },
  { id: 'abs',        label: 'Abs',         view: 'front', color: '#22C55E' },
  { id: 'quads',      label: 'Quads',       view: 'front', color: '#06B6D4' },
  { id: 'calves',     label: 'Calves',      view: 'front', color: '#8B5CF6' },
  { id: 'traps',      label: 'Traps',       view: 'back',  color: '#EF4444' },
  { id: 'lats',       label: 'Lats',        view: 'back',  color: '#F97316' },
  { id: 'triceps',    label: 'Triceps',     view: 'back',  color: '#EAB308' },
  { id: 'lower_back', label: 'Lower Back',  view: 'back',  color: '#22C55E' },
  { id: 'glutes',     label: 'Glutes',      view: 'back',  color: '#06B6D4' },
  { id: 'hamstrings', label: 'Hamstrings',  view: 'back',  color: '#8B5CF6' },
  { id: 'calves_back',label: 'Calves',      view: 'back',  color: '#EC4899' },
];

// ─── Static exercise fallback data ───────────────────────────────────────────

const EXERCISES: Record<MuscleId, { name: string; sets: string; reps: string; difficulty: string }[]> = {
  chest: [
    { name: 'Bench Press', sets: '4', reps: '8–12', difficulty: 'Intermediate' },
    { name: 'Incline Dumbbell Press', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
    { name: 'Cable Crossover', sets: '3', reps: '12–15', difficulty: 'Beginner' },
    { name: 'Chest Dips', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
    { name: 'Push-ups', sets: '3', reps: '15–20', difficulty: 'Beginner' },
    { name: 'Pec Deck', sets: '3', reps: '12–15', difficulty: 'Beginner' },
  ],
  shoulders: [
    { name: 'Overhead Press', sets: '4', reps: '8–10', difficulty: 'Intermediate' },
    { name: 'Lateral Raises', sets: '3', reps: '12–15', difficulty: 'Beginner' },
    { name: 'Front Raises', sets: '3', reps: '12', difficulty: 'Beginner' },
    { name: 'Rear Delt Fly', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: 'Arnold Press', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
    { name: 'Face Pull', sets: '3', reps: '15', difficulty: 'Beginner' },
  ],
  biceps: [
    { name: 'Barbell Curl', sets: '4', reps: '10–12', difficulty: 'Beginner' },
    { name: 'Hammer Curls', sets: '3', reps: '12', difficulty: 'Beginner' },
    { name: 'Concentration Curl', sets: '3', reps: '12', difficulty: 'Beginner' },
    { name: 'Incline Dumbbell Curl', sets: '3', reps: '10', difficulty: 'Intermediate' },
    { name: 'Cable Curl', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: 'Preacher Curl', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
  ],
  forearms: [
    { name: 'Wrist Curl', sets: '3', reps: '15–20', difficulty: 'Beginner' },
    { name: 'Reverse Wrist Curl', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: "Farmer's Walk", sets: '3', reps: '30s', difficulty: 'Beginner' },
    { name: 'Dead Hang', sets: '3', reps: '30–60s', difficulty: 'Beginner' },
    { name: 'Reverse Curl', sets: '3', reps: '12', difficulty: 'Beginner' },
  ],
  abs: [
    { name: 'Crunches', sets: '3', reps: '20', difficulty: 'Beginner' },
    { name: 'Plank', sets: '3', reps: '45–60s', difficulty: 'Beginner' },
    { name: 'Hanging Leg Raises', sets: '3', reps: '15', difficulty: 'Intermediate' },
    { name: 'Ab Wheel Rollout', sets: '3', reps: '10', difficulty: 'Advanced' },
    { name: 'Russian Twist', sets: '3', reps: '20', difficulty: 'Beginner' },
    { name: 'Cable Crunch', sets: '3', reps: '15', difficulty: 'Intermediate' },
  ],
  quads: [
    { name: 'Barbell Squat', sets: '4', reps: '8–10', difficulty: 'Intermediate' },
    { name: 'Leg Press', sets: '4', reps: '10–12', difficulty: 'Beginner' },
    { name: 'Walking Lunges', sets: '3', reps: '12 each', difficulty: 'Beginner' },
    { name: 'Leg Extension', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: 'Hack Squat', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
    { name: 'Bulgarian Split Squat', sets: '3', reps: '10 each', difficulty: 'Intermediate' },
  ],
  calves: [
    { name: 'Standing Calf Raise', sets: '4', reps: '15–20', difficulty: 'Beginner' },
    { name: 'Seated Calf Raise', sets: '3', reps: '20', difficulty: 'Beginner' },
    { name: 'Single-Leg Calf Raise', sets: '3', reps: '15 each', difficulty: 'Beginner' },
    { name: 'Donkey Calf Raise', sets: '3', reps: '15', difficulty: 'Intermediate' },
    { name: 'Box Jump', sets: '3', reps: '10', difficulty: 'Intermediate' },
  ],
  traps: [
    { name: 'Barbell Shrug', sets: '4', reps: '12', difficulty: 'Beginner' },
    { name: 'Dumbbell Shrug', sets: '3', reps: '12–15', difficulty: 'Beginner' },
    { name: 'Face Pull', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: 'Rack Pull', sets: '3', reps: '8', difficulty: 'Advanced' },
    { name: 'Upright Row', sets: '3', reps: '12', difficulty: 'Intermediate' },
  ],
  lats: [
    { name: 'Pull-ups', sets: '4', reps: '8–10', difficulty: 'Intermediate' },
    { name: 'Lat Pulldown', sets: '4', reps: '10–12', difficulty: 'Beginner' },
    { name: 'Seated Cable Row', sets: '3', reps: '10–12', difficulty: 'Beginner' },
    { name: 'Single-Arm DB Row', sets: '3', reps: '12 each', difficulty: 'Beginner' },
    { name: 'T-Bar Row', sets: '3', reps: '10', difficulty: 'Intermediate' },
    { name: 'Straight-Arm Pulldown', sets: '3', reps: '15', difficulty: 'Beginner' },
  ],
  triceps: [
    { name: 'Tricep Pushdown', sets: '4', reps: '12–15', difficulty: 'Beginner' },
    { name: 'Skull Crushers', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
    { name: 'Overhead Tricep Extension', sets: '3', reps: '12', difficulty: 'Beginner' },
    { name: 'Close-Grip Bench Press', sets: '3', reps: '8–10', difficulty: 'Intermediate' },
    { name: 'Dips', sets: '3', reps: '10–12', difficulty: 'Intermediate' },
    { name: 'Kickbacks', sets: '3', reps: '15', difficulty: 'Beginner' },
  ],
  lower_back: [
    { name: 'Deadlift', sets: '4', reps: '5–8', difficulty: 'Advanced' },
    { name: 'Romanian Deadlift', sets: '3', reps: '10', difficulty: 'Intermediate' },
    { name: 'Back Extension', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: 'Good Morning', sets: '3', reps: '12', difficulty: 'Intermediate' },
    { name: 'Superman Hold', sets: '3', reps: '15', difficulty: 'Beginner' },
  ],
  glutes: [
    { name: 'Hip Thrust', sets: '4', reps: '10–12', difficulty: 'Beginner' },
    { name: 'Glute Bridge', sets: '3', reps: '15', difficulty: 'Beginner' },
    { name: 'Sumo Squat', sets: '3', reps: '12', difficulty: 'Beginner' },
    { name: 'Cable Kickback', sets: '3', reps: '15 each', difficulty: 'Beginner' },
    { name: 'Step-Ups', sets: '3', reps: '12 each', difficulty: 'Beginner' },
    { name: 'Donkey Kick', sets: '3', reps: '15 each', difficulty: 'Beginner' },
  ],
  hamstrings: [
    { name: 'Leg Curl', sets: '4', reps: '12', difficulty: 'Beginner' },
    { name: 'Romanian Deadlift', sets: '3', reps: '10', difficulty: 'Intermediate' },
    { name: 'Good Morning', sets: '3', reps: '12', difficulty: 'Intermediate' },
    { name: 'Nordic Curl', sets: '3', reps: '8', difficulty: 'Advanced' },
    { name: 'Stiff-Leg Deadlift', sets: '3', reps: '10', difficulty: 'Intermediate' },
  ],
  calves_back: [
    { name: 'Standing Calf Raise', sets: '4', reps: '15–20', difficulty: 'Beginner' },
    { name: 'Seated Calf Raise', sets: '3', reps: '20', difficulty: 'Beginner' },
    { name: 'Single-Leg Calf Raise', sets: '3', reps: '15 each', difficulty: 'Beginner' },
    { name: 'Donkey Calf Raise', sets: '3', reps: '15', difficulty: 'Intermediate' },
  ],
};

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#22C55E',
  Intermediate: '#EAB308',
  Advanced: '#EF4444',
};

// ─── SVG Body ─────────────────────────────────────────────────────────────────

const INACTIVE = '#252830';
const OUTLINE  = '#1A1C20';

function BodySVG({
  view,
  selected,
  onSelect,
}: {
  view: 'front' | 'back';
  selected: MuscleId | null;
  onSelect: (id: MuscleId) => void;
}) {
  const fill = (id: MuscleId) => {
    const muscle = MUSCLES.find(m => m.id === id)!;
    if (selected === id) return muscle.color;
    if (selected === null) return INACTIVE;
    return INACTIVE;
  };

  const opacity = (id: MuscleId) => (selected === null || selected === id ? 1 : 0.35);

  const props = (id: MuscleId) => ({
    fill: fill(id),
    opacity: opacity(id),
    onPress: () => onSelect(id),
  });

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${VB_W} ${VB_H}`}>

      {/* ── Non-muscle body parts (always visible, dark) ── */}
      {/* Head */}
      <Ellipse cx={100} cy={30} rx={18} ry={22} fill={OUTLINE} />
      {/* Face features placeholder */}
      <Ellipse cx={100} cy={30} rx={13} ry={17} fill="#1E2124" />

      {/* Neck */}
      <Rect x={93} y={50} width={14} height={16} rx={4} fill={OUTLINE} />

      {/* Hands */}
      <Ellipse cx={31} cy={192} rx={9} ry={11} fill={OUTLINE} />
      <Ellipse cx={169} cy={192} rx={9} ry={11} fill={OUTLINE} />

      {/* Knees */}
      <Ellipse cx={82} cy={288} rx={16} ry={10} fill={OUTLINE} />
      <Ellipse cx={118} cy={288} rx={16} ry={10} fill={OUTLINE} />

      {/* Feet */}
      {view === 'front' && <>
        <Ellipse cx={78} cy={372} rx={15} ry={8} fill={OUTLINE} />
        <Ellipse cx={122} cy={372} rx={15} ry={8} fill={OUTLINE} />
      </>}
      {view === 'back' && <>
        <Ellipse cx={78} cy={372} rx={12} ry={8} fill={OUTLINE} />
        <Ellipse cx={122} cy={372} rx={12} ry={8} fill={OUTLINE} />
      </>}

      {/* ── FRONT VIEW ── */}
      {view === 'front' && <>
        {/* Torso silhouette base */}
        <Path d="M 68 66 L 62 72 L 58 92 L 58 178 Q 68 188 100 188 Q 132 188 142 178 L 142 92 L 138 72 L 132 66 Z"
          fill={OUTLINE} />

        {/* Left & Right upper arms base */}
        <Ellipse cx={48} cy={112} rx={13} ry={38} transform="rotate(-6 48 112)" fill={OUTLINE} />
        <Ellipse cx={152} cy={112} rx={13} ry={38} transform="rotate(6 152 112)" fill={OUTLINE} />

        {/* Left & Right forearms base */}
        <Ellipse cx={38} cy={160} rx={10} ry={26} transform="rotate(-10 38 160)" fill={OUTLINE} />
        <Ellipse cx={162} cy={160} rx={10} ry={26} transform="rotate(10 162 160)" fill={OUTLINE} />

        {/* Hips */}
        <Ellipse cx={100} cy={190} rx={36} ry={12} fill={OUTLINE} />

        {/* Legs base */}
        <Ellipse cx={83} cy={244} rx={22} ry={44} fill={OUTLINE} />
        <Ellipse cx={117} cy={244} rx={22} ry={44} fill={OUTLINE} />

        {/* Lower legs base */}
        <Ellipse cx={80} cy={330} rx={14} ry={32} fill={OUTLINE} />
        <Ellipse cx={120} cy={330} rx={14} ry={32} fill={OUTLINE} />

        {/* ── Muscle regions (front) ── */}

        {/* Shoulders */}
        <Ellipse cx={62} cy={76} rx={14} ry={12} transform="rotate(-15 62 76)" {...props('shoulders')} />
        <Ellipse cx={138} cy={76} rx={14} ry={12} transform="rotate(15 138 76)" {...props('shoulders')} />

        {/* Chest */}
        <Ellipse cx={86} cy={100} rx={20} ry={16} {...props('chest')} />
        <Ellipse cx={114} cy={100} rx={20} ry={16} {...props('chest')} />

        {/* Biceps */}
        <Ellipse cx={48} cy={110} rx={10} ry={28} transform="rotate(-6 48 110)" {...props('biceps')} />
        <Ellipse cx={152} cy={110} rx={10} ry={28} transform="rotate(6 152 110)" {...props('biceps')} />

        {/* Forearms */}
        <Ellipse cx={38} cy={158} rx={8} ry={22} transform="rotate(-10 38 158)" {...props('forearms')} />
        <Ellipse cx={162} cy={158} rx={8} ry={22} transform="rotate(10 162 158)" {...props('forearms')} />

        {/* Abs — 6-pack grid */}
        <G {...props('abs')}>
          <Rect x={91} y={120} width={8} height={10} rx={3} />
          <Rect x={101} y={120} width={8} height={10} rx={3} />
          <Rect x={91} y={133} width={8} height={10} rx={3} />
          <Rect x={101} y={133} width={8} height={10} rx={3} />
          <Rect x={91} y={146} width={8} height={10} rx={3} />
          <Rect x={101} y={146} width={8} height={10} rx={3} />
          {/* Obliques */}
          <Rect x={80} y={126} width={8} height={16} rx={4} opacity={0.6} />
          <Rect x={112} y={126} width={8} height={16} rx={4} opacity={0.6} />
        </G>

        {/* Quads */}
        <Ellipse cx={83} cy={248} rx={18} ry={40} {...props('quads')} />
        <Ellipse cx={117} cy={248} rx={18} ry={40} {...props('quads')} />

        {/* Calves */}
        <Ellipse cx={80} cy={330} rx={11} ry={26} {...props('calves')} />
        <Ellipse cx={120} cy={330} rx={11} ry={26} {...props('calves')} />
      </>}

      {/* ── BACK VIEW ── */}
      {view === 'back' && <>
        {/* Torso base */}
        <Path d="M 68 66 L 62 72 L 58 92 L 58 178 Q 68 188 100 188 Q 132 188 142 178 L 142 92 L 138 72 L 132 66 Z"
          fill={OUTLINE} />

        {/* Upper arms base */}
        <Ellipse cx={48} cy={112} rx={13} ry={38} transform="rotate(-6 48 112)" fill={OUTLINE} />
        <Ellipse cx={152} cy={112} rx={13} ry={38} transform="rotate(6 152 112)" fill={OUTLINE} />

        {/* Forearms base */}
        <Ellipse cx={38} cy={160} rx={10} ry={26} transform="rotate(-10 38 160)" fill={OUTLINE} />
        <Ellipse cx={162} cy={160} rx={10} ry={26} transform="rotate(10 162 160)" fill={OUTLINE} />

        {/* Hips */}
        <Ellipse cx={100} cy={190} rx={36} ry={12} fill={OUTLINE} />

        {/* Legs base */}
        <Ellipse cx={83} cy={248} rx={22} ry={44} fill={OUTLINE} />
        <Ellipse cx={117} cy={248} rx={22} ry={44} fill={OUTLINE} />

        {/* Lower legs base */}
        <Ellipse cx={80} cy={330} rx={14} ry={32} fill={OUTLINE} />
        <Ellipse cx={120} cy={330} rx={14} ry={32} fill={OUTLINE} />

        {/* ── Muscle regions (back) ── */}

        {/* Traps */}
        <Path d="M 72 60 Q 100 52 128 60 L 138 86 Q 100 94 62 86 Z" {...props('traps')} />

        {/* Shoulders (rear delts) */}
        <Ellipse cx={62} cy={76} rx={13} ry={11} transform="rotate(-15 62 76)"
          fill={selected === 'traps' ? MUSCLES[7].color : INACTIVE}
          opacity={selected === null || selected === 'traps' ? 0.5 : 0.15} />
        <Ellipse cx={138} cy={76} rx={13} ry={11} transform="rotate(15 138 76)"
          fill={selected === 'traps' ? MUSCLES[7].color : INACTIVE}
          opacity={selected === null || selected === 'traps' ? 0.5 : 0.15} />

        {/* Lats */}
        <Path d="M 62 90 L 64 152 Q 76 162 90 158 L 92 110 Q 80 100 68 90 Z" {...props('lats')} />
        <Path d="M 138 90 L 136 152 Q 124 162 110 158 L 108 110 Q 120 100 132 90 Z" {...props('lats')} />

        {/* Triceps */}
        <Ellipse cx={48} cy={110} rx={10} ry={28} transform="rotate(-6 48 110)" {...props('triceps')} />
        <Ellipse cx={152} cy={110} rx={10} ry={28} transform="rotate(6 152 110)" {...props('triceps')} />

        {/* Lower Back (erectors) */}
        <G {...props('lower_back')}>
          <Rect x={88} y={154} width={9} height={26} rx={4} />
          <Rect x={103} y={154} width={9} height={26} rx={4} />
        </G>

        {/* Glutes */}
        <Ellipse cx={86} cy={202} rx={22} ry={18} {...props('glutes')} />
        <Ellipse cx={114} cy={202} rx={22} ry={18} {...props('glutes')} />

        {/* Hamstrings */}
        <Ellipse cx={83} cy={252} rx={18} ry={40} {...props('hamstrings')} />
        <Ellipse cx={117} cy={252} rx={18} ry={40} {...props('hamstrings')} />

        {/* Calves back */}
        <Ellipse cx={80} cy={330} rx={11} ry={26} {...props('calves_back')} />
        <Ellipse cx={120} cy={330} rx={11} ry={26} {...props('calves_back')} />
      </>}

    </Svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MuscleBodyMap({ onMuscleSelect }: { onMuscleSelect?: () => void } = {}) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<MuscleId | null>(null);

  // Flip animation (scaleX 1 → 0 → 1 simulates Y-axis rotation)
  const flipAnim = useRef(new Animated.Value(1)).current;

  const flip = useCallback((target: 'front' | 'back') => {
    if (target === view) return;
    Animated.sequence([
      Animated.timing(flipAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(flipAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setView(target);
      setSelected(null);
    }, 160);
  }, [view]);

  const handleSelect = useCallback((id: MuscleId) => {
    setSelected(prev => {
      if (prev === id) return null;
      // Delay scroll until after the exercise panel has rendered
      setTimeout(() => onMuscleSelect?.(), 100);
      return id;
    });
  }, [onMuscleSelect]);

  const selectedInfo = selected ? MUSCLES.find(m => m.id === selected) : null;
  const exercises    = selected ? EXERCISES[selected] : [];
  const frontMuscles = MUSCLES.filter(m => m.view === 'front');
  const backMuscles  = MUSCLES.filter(m => m.view === 'back');

  return (
    <View style={s.card}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Muscle Map</Text>
          <Text style={s.sub}>Tap a muscle to see exercises</Text>
        </View>
        <View style={s.viewToggle}>
          <TouchableOpacity
            style={[s.toggleBtn, view === 'front' && s.toggleBtnActive]}
            onPress={() => flip('front')}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleText, view === 'front' && s.toggleTextActive]}>Front</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, view === 'back' && s.toggleBtnActive]}
            onPress={() => flip('back')}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleText, view === 'back' && s.toggleTextActive]}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body + muscle chips row */}
      <View style={s.bodyRow}>

        {/* Left muscle chips */}
        <View style={s.chipCol}>
          {(view === 'front' ? frontMuscles.slice(0, 4) : backMuscles.slice(0, 4)).map(m => (
            <TouchableOpacity
              key={m.id}
              style={[s.sideChip, selected === m.id && { backgroundColor: m.color + '22', borderColor: m.color }]}
              onPress={() => handleSelect(m.id)}
              activeOpacity={0.7}
            >
              <View style={[s.chipDot, { backgroundColor: m.color }]} />
              <Text style={[s.chipLabel, selected === m.id && { color: m.color }]} numberOfLines={1}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Body SVG */}
        <Animated.View style={{ transform: [{ scaleX: flipAnim }] }}>
          <BodySVG view={view} selected={selected} onSelect={handleSelect} />
        </Animated.View>

        {/* Right muscle chips */}
        <View style={s.chipCol}>
          {(view === 'front' ? frontMuscles.slice(4) : backMuscles.slice(4)).map(m => (
            <TouchableOpacity
              key={m.id}
              style={[s.sideChip, selected === m.id && { backgroundColor: m.color + '22', borderColor: m.color }]}
              onPress={() => handleSelect(m.id)}
              activeOpacity={0.7}
            >
              <View style={[s.chipDot, { backgroundColor: m.color }]} />
              <Text style={[s.chipLabel, selected === m.id && { color: m.color }]} numberOfLines={1}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Swipe hint */}
      <View style={s.swipeHint}>
        <Ionicons name="swap-horizontal-outline" size={12} color="#444" />
        <Text style={s.swipeHintText}>Swipe to rotate</Text>
      </View>

      {/* Exercise Panel */}
      {selected && selectedInfo && (
        <View style={s.exercisePanel}>
          {/* Panel header */}
          <View style={[s.panelHeader, { borderLeftColor: selectedInfo.color }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.panelMuscle, { color: selectedInfo.color }]}>{selectedInfo.label}</Text>
              <Text style={s.panelCount}>{exercises.length} exercises</Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color="#444" />
            </TouchableOpacity>
          </View>

          {/* Exercise list */}
          <ScrollView
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {exercises.map((ex, i) => (
              <View key={i} style={[
                s.exRow,
                i < exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#1E2124' },
              ]}>
                <View style={[s.exNum, { backgroundColor: selectedInfo.color + '22' }]}>
                  <Text style={[s.exNumText, { color: selectedInfo.color }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMeta}>{ex.sets} sets · {ex.reps} reps</Text>
                </View>
                <View style={[s.diffBadge, { backgroundColor: DIFF_COLOR[ex.difficulty] + '22' }]}>
                  <Text style={[s.diffText, { color: DIFF_COLOR[ex.difficulty] }]}>{ex.difficulty}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tap prompt when nothing selected */}
      {!selected && (
        <View style={s.emptyPrompt}>
          <Ionicons name="hand-left-outline" size={20} color="#333" />
          <Text style={s.emptyText}>Tap a muscle on the body or use the labels</Text>
        </View>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: '#111318',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E2124',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: '#444', fontSize: 11, marginTop: 2 },

  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#0E1012',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  toggleBtnActive: { backgroundColor: '#EF4444' },
  toggleText: { color: '#555', fontSize: 12, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },

  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },

  chipCol: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 4,
  },
  sideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0E1012',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1E2124',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  chipLabel: { color: '#555', fontSize: 10, fontWeight: '600', flex: 1 },

  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 10,
  },
  swipeHintText: { color: '#333', fontSize: 10 },

  exercisePanel: {
    borderTopWidth: 1,
    borderTopColor: '#1E2124',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 14,
  },
  panelMuscle: { fontSize: 15, fontWeight: '800' },
  panelCount: { color: '#555', fontSize: 11, marginTop: 2 },

  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },
  exNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  exNumText: { fontSize: 12, fontWeight: '800' },
  exName: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  exMeta: { color: '#555', fontSize: 11, marginTop: 2 },
  diffBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexShrink: 0,
  },
  diffText: { fontSize: 10, fontWeight: '700' },

  emptyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1C20',
  },
  emptyText: { color: '#333', fontSize: 12 },
});
