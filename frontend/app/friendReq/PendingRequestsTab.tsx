import React from 'react';
import { View, Text, Image, FlatList } from 'react-native';

type Props = {
  requests: Array<{
    _id: string;
    user1: { _id: string; firstName: string; lastName: string; imageUrl: string[] };
    user2: string;
    status: string;
    requestedBy: string;
    createdAt: string;
  }>;
  userId: string;
};

const PendingRequestsTab: React.FC<Props> = ({ requests, userId }) => {
  const renderItem = ({ item }: { item: any }) => {
    const requester =
      item.user1._id === userId ? null : item.user1; // Show only incoming requests
    if (!requester) return null;

    return (
      <View className="bg-zinc-700 p-3 rounded-lg mb-3 flex-row items-center">
        <Image
          source={{ uri: requester.imageUrl?.[0] }}
          className="w-12 h-12 rounded-full mr-4"
        />
        <View>
          <Text className="text-white text-base font-semibold">
            {requester.firstName} {requester.lastName}
          </Text>
          <Text className="text-gray-300 text-xs">Sent you a friend request</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      ListEmptyComponent={
        <Text className="text-gray-400 text-center mt-6">No pending requests.</Text>
      }
    />
  );
};

export default PendingRequestsTab;
