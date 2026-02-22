import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TaskType = {
  id: string;
  text: string;
  completed: boolean;
};

const DailyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([
    { id: '1', text: 'Complete 30 minutes of cardio workout', completed: false },
    { id: '2', text: 'Drink 2 liters of water throughout the day', completed: false },
    { id: '3', text: 'Do 3 sets of weightlifting exercises', completed: false },
    { id: '4', text: 'Stretch for 15 minutes before bed', completed: false },
  ]);
  
  // Track which tasks are displayed
  const [displayedTaskIds, setDisplayedTaskIds] = useState(['1', '2']);
  const fadeAnims = useRef<{[key: string]: Animated.Value}>({});
  
  // Initialize animation values for all tasks
  useEffect(() => {
    tasks.forEach(task => {
      if (!fadeAnims.current[task.id]) {
        fadeAnims.current[task.id] = new Animated.Value(
          displayedTaskIds.includes(task.id) ? 1 : 0
        );
      }
    });
  }, [tasks]);

  // Calculate completion percentage
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionPercentage = (completedTasks / tasks.length) * 100;
  const formattedPercentage = Math.round(completionPercentage);

  const toggleTask = (id: string) => {
    // Find next uncompleted task not currently displayed
    const currentlyDisplayed = new Set(displayedTaskIds);
    const nextTaskToShow = tasks.find(task => 
      !task.completed && !currentlyDisplayed.has(task.id) && task.id !== id
    );
    
    // Mark the task as completed
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: true } : task
      )
    );
    
    if (nextTaskToShow) {
      // Animate the transition
      // Fade out the completed task
      Animated.timing(fadeAnims.current[id], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Update displayed tasks
        setDisplayedTaskIds(prev => {
          const newDisplayed = [...prev];
          const indexToReplace = newDisplayed.indexOf(id);
          if (indexToReplace !== -1) {
            newDisplayed[indexToReplace] = nextTaskToShow.id;
          }
          return newDisplayed;
        });
        
        // Fade in the new task
        Animated.timing(fadeAnims.current[nextTaskToShow.id], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Helper function to render a task item with animation
  const renderTaskItem = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    return (
      <Animated.View 
        key={task.id}
        style={{ opacity: fadeAnims.current[task.id] || 1 }}
      >
        <TouchableOpacity
          className="flex-row items-center py-2"
          onPress={() => !task.completed && toggleTask(task.id)}
        >
          <View className={`w-5 h-5 rounded-full mr-2 items-center justify-center ${
            task.completed ? 'bg-red-500' : 'bg-zinc-800 border border-zinc-700'
          }`}>
            {task.completed && (
              <Ionicons name="checkmark" size={12} color="#FFF" />
            )}
          </View>
          <Text className={`flex-1 text-xs ${
            task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
          }`} numberOfLines={1} ellipsizeMode="tail">
            {task.text}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="mx-4 my-3">
      <View className="bg-zinc-900 p-4 rounded-xl shadow-md">
        {/* Header - More compact */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="calendar-outline" size={18} color="#EF4444" />
            <Text className="text-white font-semibold text-base ml-1">Daily Tasks</Text>
          </View>
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => {/* Navigate to all tasks */}}
          >
            <Text className="text-red-500 text-xs mr-1">See All</Text>
            <Ionicons name="chevron-forward" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Progress info - Compact horizontal layout */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1 mr-4">
            <View className="h-1.5 bg-zinc-800 rounded-full w-full overflow-hidden">
              <LinearGradient
                colors={['#EF4444', '#F97316']}
                style={{ width: `${completionPercentage}%`, height: '100%' }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-zinc-400 text-xs">
                {completedTasks}/{tasks.length}
              </Text>
              <Text className="text-red-500 text-xs font-medium">
                {formattedPercentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tasks - More compact with animation */}
        <View className="min-h-12">
          {displayedTaskIds.map(taskId => renderTaskItem(taskId))}
        </View>
      </View>
    </View>
  );
};

export default DailyTasks;