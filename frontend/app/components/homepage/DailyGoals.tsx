import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeJWT } from '@/utils/jwt';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CARD_W = Dimensions.get('window').width - 32;

// Fixed heights so the card never grows
const HEADER_H = 38;
const DOTS_H   = 22;
const CONTENT_H = 110; // task list / heatmap area
const CARD_H = HEADER_H + 1 + CONTENT_H + DOTS_H; // 171px total

type Task = { _id: string; name: string; completed: boolean };
type CompletionMap = Record<number, number>;

const heatColor = (pct: number | null, isFuture: boolean): string => {
  if (isFuture)   return '#0D0D0D';
  if (pct === null) return '#1C1C1E';
  if (pct === 0)    return '#7F1D1D';
  if (pct < 34)     return '#EF4444';
  if (pct < 67)     return '#F97316';
  if (pct < 100)    return '#FACC15';
  return '#22C55E';
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Heatmap (scrolls vertically inside fixed CONTENT_H) ─────────────────────
function Heatmap({ map, year, month, loading }: {
  map: CompletionMap; year: number; month: number; loading: boolean;
}) {
  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() === month - 1
    ? today.getDate() : -1;

  const firstDow   = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ day: number | null; pct: number | null; isToday: boolean; isFuture: boolean }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, pct: null, isToday: false, isFuture: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, pct: map[d] ?? null, isToday: d === todayDay, isFuture: todayDay > 0 && d > todayDay });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, pct: null, isToday: false, isFuture: false });

  const gap      = 3;
  const innerW   = CARD_W - 24;
  const cellSize = Math.floor((innerW - gap * 6) / 7);

  return (
    <ScrollView
      style={{ width: CARD_W, height: CONTENT_H }}
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Month + legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: '#ccc', fontSize: 11, fontWeight: '700' }}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ color: '#3A3A3A', fontSize: 8 }}>None</Text>
          {['#7F1D1D','#EF4444','#F97316','#FACC15','#22C55E'].map(c => (
            <View key={c} style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: c }} />
          ))}
          <Text style={{ color: '#3A3A3A', fontSize: 8 }}>All</Text>
        </View>
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', marginBottom: 3 }}>
        {DAY_LABELS.map(d => (
          <View key={d} style={{ width: cellSize, marginRight: gap, alignItems: 'center' }}>
            <Text style={{ color: '#3A3A3A', fontSize: 8, fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={{ height: 60, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="#A78BFA" />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {cells.map((cell, i) => {
            if (!cell.day) return <View key={`e-${i}`} style={{ width: cellSize, height: cellSize }} />;
            return (
              <View key={cell.day} style={{
                width: cellSize, height: cellSize, borderRadius: 4,
                backgroundColor: heatColor(cell.pct, cell.isFuture),
                alignItems: 'center', justifyContent: 'center',
                borderWidth: cell.isToday ? 1.5 : 0, borderColor: '#A78BFA',
              }}>
                <Text style={{ color: '#00000060', fontSize: 7, fontWeight: '800' }}>{cell.day}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const PREVIEW = 3;

const DailyTasks: React.FC = () => {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [userId, setUserId]     = useState<string | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [isRestDay, setIsRestDay]   = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [map, setMap]           = useState<CompletionMap>({});
  const [heatLoading, setHeatLoading] = useState(true);
  const [page, setPage]         = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('authToken');
        if (!t) throw new Error('Not authenticated');
        setToken(t);
        const uid = (decodeJWT(t) as any)?.id;
        if (!uid) throw new Error('Invalid token');
        setUserId(uid);

        const [tRes, hRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/user-tasks/daily/${uid}`, { headers: { Authorization: `Bearer ${t}` } }),
          fetch(`${API_URL}/api/v1/user-tasks/monthly/${uid}?year=${yr}&month=${mo}`, { headers: { Authorization: `Bearer ${t}` } }),
        ]);

        if (!tRes.ok) throw new Error((await tRes.json()).message || 'Failed');
        const taskList: Task[] = (await tRes.json()).data?.tasks ?? [];
        setTasks(taskList);
        if (taskList.length === 1 && taskList[0].name.toLowerCase().includes('rest day')) setIsRestDay(true);
        if (hRes.ok) setMap((await hRes.json()).data ?? {});
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
        setHeatLoading(false);
      }
    })();
  }, []);

  const completeTask = async (id: string) => {
    if (!userId || !token || completing) return;
    setCompleting(id);
    setTasks(p => p.map(t => t._id === id ? { ...t, completed: true } : t));
    try {
      const res  = await fetch(`${API_URL}/api/v1/user-tasks/complete/${userId}/${id}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data?.tasks) {
        const updated: Task[] = data.data.tasks;
        setTasks(updated);
        const d = now.getDate(), total = updated.length, done = updated.filter(t => t.completed).length;
        setMap(p => ({ ...p, [d]: total > 0 ? Math.round((done / total) * 100) : 0 }));
      }
    } catch { /* optimistic stays */ } finally { setCompleting(null); }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / CARD_W));

  const done  = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone   = total > 0 && done === total;
  const visible   = expanded ? tasks : tasks.slice(0, PREVIEW);
  const hiddenCnt = tasks.length - PREVIEW;

  return (
    <View style={{ marginHorizontal: 16, marginVertical: 6 }}>
      <View style={{ backgroundColor: '#111', borderRadius: 14, overflow: 'hidden', height: CARD_H }}>

        {/* Header */}
        <View style={{
          height: HEADER_H, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="barbell-outline" size={13} color="#EF4444" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {page === 0 ? "Today's Workout" : 'Monthly Progress'}
            </Text>
          </View>

          {page === 0 && !loading && !error && total > 0 && !isRestDay && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 50, height: 3, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' }}>
                <LinearGradient
                  colors={allDone ? ['#22C55E','#16A34A'] : ['#EF4444','#F97316']}
                  style={{ width: `${pct}%`, height: '100%' }}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={{ color: allDone ? '#22C55E' : '#EF4444', fontSize: 10, fontWeight: '700' }}>{pct}%</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#1A1A1A' }} />

        {/* Swipeable area — fixed height */}
        <ScrollView
          ref={scrollRef}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          decelerationRate="fast"
          snapToInterval={CARD_W}
          style={{ width: CARD_W, height: CONTENT_H }}
        >
          {/* PAGE 1 — Tasks */}
          <ScrollView
            style={{ width: CARD_W, height: CONTENT_H }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {loading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, flexDirection: 'row', gap: 8 }}>
                <ActivityIndicator size="small" color="#EF4444" />
                <Text style={{ color: '#444', fontSize: 11 }}>Loading...</Text>
              </View>

            ) : error ? (
              <View style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="fitness-outline" size={18} color="#374151" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>No plan active</Text>
                  <Text style={{ color: '#555', fontSize: 10, marginTop: 1 }}>Subscribe in My Lore tab.</Text>
                </View>
              </View>

            ) : isRestDay ? (
              <View style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="moon-outline" size={18} color="#6B7280" />
                <View>
                  <Text style={{ color: '#D1D5DB', fontWeight: '700', fontSize: 12 }}>Rest Day</Text>
                  <Text style={{ color: '#555', fontSize: 10, marginTop: 1 }}>Recover and recharge.</Text>
                </View>
              </View>

            ) : (
              <>
                {visible.map((task, i) => (
                  <TouchableOpacity
                    key={task._id}
                    onPress={() => !task.completed && completeTask(task._id)}
                    disabled={task.completed || completing === task._id}
                    activeOpacity={0.6}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
                      borderBottomWidth: i < visible.length - 1 ? 1 : 0,
                      borderBottomColor: '#1A1A1A',
                    }}
                  >
                    <View style={{
                      width: 18, height: 18, borderRadius: 9, marginRight: 9,
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      backgroundColor: task.completed ? '#22C55E' : 'transparent',
                      borderWidth: task.completed ? 0 : 1.5, borderColor: '#3F3F46',
                    }}>
                      {completing === task._id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : task.completed ? <Ionicons name="checkmark" size={10} color="#fff" /> : null}
                    </View>
                    <Text numberOfLines={1} style={{
                      flex: 1, fontSize: 12,
                      color: task.completed ? '#4B5563' : '#D1D5DB',
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                    }}>
                      {task.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                {hiddenCnt > 0 && (
                  <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7}
                    style={{ paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '600' }}>
                      {expanded ? 'Show less' : `+${hiddenCnt} more`}
                    </Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={10} color="#EF4444" />
                  </TouchableOpacity>
                )}

                {allDone && (
                  <View style={{
                    marginTop: 6, flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', paddingVertical: 6,
                    backgroundColor: '#14532D22', borderRadius: 8,
                    gap: 5, borderWidth: 1, borderColor: '#22C55E22',
                  }}>
                    <Ionicons name="trophy-outline" size={11} color="#22C55E" />
                    <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>Session complete!</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* PAGE 2 — Heatmap */}
          <Heatmap map={map} year={yr} month={mo} loading={heatLoading} />
        </ScrollView>

        {/* Page dots */}
        <View style={{ height: DOTS_H, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
          {[0, 1].map(i => (
            <TouchableOpacity key={i} onPress={() => scrollRef.current?.scrollTo({ x: i * CARD_W, animated: true })} activeOpacity={0.7}>
              <View style={{ width: page === i ? 12 : 4, height: 4, borderRadius: 2, backgroundColor: page === i ? '#EF4444' : '#2A2A2A' }} />
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </View>
  );
};

export default DailyTasks;
