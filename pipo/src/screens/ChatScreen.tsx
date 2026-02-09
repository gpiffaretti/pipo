import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';

type MessageType = 'text' | 'audio' | 'photo' | 'video';

type Message = {
  id: string;
  type: MessageType;
  body?: string;
  isMine: boolean;
  time: string;
};

const SAMPLE_MESSAGES: Message[] = [
  {
    id: 'm-1',
    type: 'text',
    body: 'First laugh today. She giggled for five minutes straight.',
    isMine: true,
    time: '9:12 AM',
  },
  {
    id: 'm-2',
    type: 'photo',
    isMine: false,
    time: '9:13 AM',
  },
  {
    id: 'm-3',
    type: 'audio',
    isMine: true,
    time: '9:20 AM',
  },
  {
    id: 'm-4',
    type: 'video',
    isMine: false,
    time: '9:40 AM',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function MessageSeparator() {
  return <View style={styles.separator} />;
}

function MessageBubble({ message }: { message: Message }) {
  const isText = message.type === 'text';
  const label =
    message.type === 'audio'
      ? 'Audio message'
      : message.type === 'photo'
        ? 'Photo'
        : message.type === 'video'
          ? 'Video'
          : '';

  return (
    <View
      style={[
        styles.bubble,
        message.isMine ? styles.bubbleMine : styles.bubbleTheirs,
      ]}
    >
      {isText ? (
        <Text style={styles.bubbleText}>{message.body}</Text>
      ) : (
        <Text style={styles.placeholderText}>{label}</Text>
      )}
      <Text style={styles.timestamp}>{message.time}</Text>
    </View>
  );
}

function ChatScreen({ route }: Props) {
  const { chatId } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat {chatId}</Text>
        <Text style={styles.headerSubtitle}>Most recent memories</Text>
      </View>

      <FlatList
        data={SAMPLE_MESSAGES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={MessageSeparator}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      <View style={styles.inputBar}>
        <TextInput
          placeholder="Type a memory..."
          placeholderTextColor="#8A8A8A"
          style={styles.input}
        />
        <Pressable accessibilityRole="button" style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE7',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3DED3',
    backgroundColor: '#FBF8F1',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6D6D6D',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  separator: {
    height: 12,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  bubbleMine: {
    backgroundColor: '#1E1E1E',
    alignSelf: 'flex-end',
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D6',
  },
  bubbleText: {
    fontSize: 15,
    color: '#FDFBF7',
  },
  placeholderText: {
    fontSize: 14,
    color: '#2B2B2B',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#8D8D8D',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E1DBCF',
    backgroundColor: '#FBF8F1',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#1E1E1E',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
  },
  sendButtonText: {
    color: '#F7F4EE',
    fontWeight: '600',
  },
});

export default ChatScreen;
