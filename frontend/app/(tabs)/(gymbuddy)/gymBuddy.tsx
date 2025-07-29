import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { decodeJWT } from "@/utils/jwt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type GymBuddy = {
  id: string;
  name: string;
  age: number;
  distance: string;
  bio: string;
  image: string;
  points: number;
  tags: string[];
};

const GymBuddyScreen = () => {
  const [index, setIndex] = useState(0);
  const [gymBuddies, setGymBuddies] = useState<GymBuddy[]>([]);
  const [isOutOfCards, setIsOutOfCards] = useState(false);
  const swiperRef = useRef<Swiper<GymBuddy>>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;

  // 👇 Fetch data from the API


useEffect(() => {
  const fetchGymBuddies = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");

      // Optional: decode token if needed
      const decoded = decodeJWT(token);
      console.log("User ID:", decoded?.id || decoded?._id); // for debug

      const response = await fetch('http://172.20.10.4:3000/api/v1/user-profile?page=1&limit=10', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch profiles.');

      const result = await response.json();
    
      const profiles = result.data || [];

      console.log(profiles);

      const transformed = profiles.map((p: any) => ({
        id: p._id,
        name: p.firstName || 'Unknown',
        age: new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
        distance: `${Math.floor(Math.random() * 10) + 1} km`,
        bio: p.bio || 'Let’s work out together!',
        image: p.imageUrl?.[0] || 'https://via.placeholder.com/400',
        points: Math.floor(Math.random() * 1000) + 1000,
        tags: p.interests?.slice(0, 3) || ['Fitness'],
      }));

      setGymBuddies(transformed);
    } catch (error) {
      console.error("Error fetching gym buddies:", error);
    }
  };

  fetchGymBuddies();
}, []);


  const handleSwipe = (cardIndex: number) => {
    const nextIndex = cardIndex + 1;
    setIndex(nextIndex);
    if (nextIndex === gymBuddies.length) {
      setIsOutOfCards(true);
    }
  };

  const animateButtons = (isLike: boolean) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(isLike ? likeOpacity : nopeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      fadeAnim.setValue(0);
      likeOpacity.setValue(0);
      nopeOpacity.setValue(0);
    });
  };

  const swipeLeft = () => {
    animateButtons(false);
    swiperRef.current?.swipeLeft();
  };

  const swipeRight = () => {
    animateButtons(true);
    swiperRef.current?.swipeRight();
  };

  const renderCard = (buddy: GymBuddy) => {
      if (!buddy) return null;
    return (
      <View style={styles.card}>
        <Image source={{ uri: buddy.image }} style={styles.image} />

        <LinearGradient colors={['transparent', '#000']} style={styles.gradient} />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{buddy.name}, {buddy.age}</Text>
          <Text style={styles.distance}>{buddy.distance} away</Text>
          <Text style={styles.bio}>{buddy.bio}</Text>
          <View style={styles.tagsContainer}>
            {buddy.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Swiper
        ref={swiperRef}
        cards={gymBuddies}
        renderCard={renderCard}
        onSwiped={handleSwipe}
        cardIndex={index}
        backgroundColor="transparent"
        stackSize={3}
        infinite={false}
        showSecondCard
        animateCardOpacity
        verticalSwipe={false}
        onSwipedAll={() => setIsOutOfCards(true)}
      />

      {isOutOfCards && (
        <View style={styles.outOfCards}>
          <Text style={styles.outOfCardsText}>No more buddies to show!</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity onPress={swipeLeft} style={styles.nopeButton}>
          <Ionicons name="close-circle" size={64} color="#ff6b6b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={swipeRight} style={styles.likeButton}>
          <Ionicons name="heart-circle" size={64} color="#4cd137" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GymBuddyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  card: {
    height: '75%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
  },
  image: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    bottom: 0,
  },
  cardContent: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  name: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  distance: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 14,
    maxWidth: width * 0.8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 5,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 20,
    marginTop: 20,
  },
  nopeButton: {},
  likeButton: {},
  outOfCards: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  outOfCardsText: {
    color: '#fff',
    fontSize: 18,
  },
});
