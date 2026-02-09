import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, Pipo.</Text>
      <Text style={styles.subtitle}>
        Phase 0 baseline is live. Next up: chat UI skeleton.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Chats')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Open Chats</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F4EE',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#3D3D3D',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
  },
  buttonText: {
    color: '#F7F4EE',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default HomeScreen;
