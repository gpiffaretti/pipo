import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ChatListItem = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
};

const CHAT_LIST: ChatListItem[] = [
  {
    id: 'chat-1',
    title: 'Luna',
    lastMessage: 'First steps video',
    timestamp: '9:42 AM',
  },
  {
    id: 'chat-2',
    title: 'Weekend Highlights',
    lastMessage: 'Photo from the beach',
    timestamp: 'Yesterday',
  },
  {
    id: 'chat-3',
    title: 'Milo',
    lastMessage: 'Voice note: bedtime story',
    timestamp: 'Mon',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Chats'>;

function ChatSeparator() {
  return <View style={styles.separator} />;
}

function ChatRow({
  item,
  onPress,
}: {
  item: ChatListItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.chatTitle}>{item.title}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      <Text style={styles.preview} numberOfLines={1}>
        {item.lastMessage}
      </Text>
    </Pressable>
  );
}

function ChatListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={CHAT_LIST}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ChatSeparator}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChatRow
            item={item}
            onPress={() => navigation.navigate('Chat', { chatId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  listContent: {
    padding: 16,
  },
  row: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  preview: {
    fontSize: 14,
    color: '#3D3D3D',
  },
  separator: {
    height: 12,
  },
});

export default ChatListScreen;
