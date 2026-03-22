import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

export default function NameInputScreen() {
  const router = useRouter();
  const { startNewGame, setLoading, clearGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const startMutation = trpc.game.start.useMutation();

  const handleStart = async () => {
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (trimmedName.length > 10) {
      setError('이름은 10자 이내로 입력해주세요.');
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarting(true);
    setError('');
    setLoading(true);

    try {
      // 1. Clear existing game state to ensure clean start
      console.log('Clearing existing state for clean start...');
      clearGame();

      // 2. Start new game mutation
      console.log('Starting game for:', trimmedName);
      const result = await startMutation.mutateAsync({ playerName: trimmedName });
      
      if (result && result.success && result.gameResponse && result.initialState) {
        console.log('Server response success. Initializing client state...');
        
        // 3. Initialize client state
        startNewGame(
          trimmedName,
          result.initialState,
          result.gameResponse,
          result.initialState.messageHistory || []
        );
        
        // 4. Navigate with sufficient delay for state to settle
        console.log('State initialization triggered. Navigating in 300ms...');
        setTimeout(() => {
          setLoading(false);
          router.replace('/game' as any);
        }, 300);
      } else {
        const errorMsg = (result as any)?.error || '서버 응답이 올바르지 않습니다.';
        console.error('Game start failed:', errorMsg);
        setError(errorMsg);
        setIsStarting(false);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('CRITICAL: Game start failed with exception:', err);
      const msg = err?.message || '알 수 없는 오류가 발생했습니다.';
      setError(`오류: ${msg}`);
      setIsStarting(false);
      setLoading(false);
      Alert.alert("운명의 실타래 오류", "서사 작가와의 연결이 원활하지 않습니다. 네트워크를 확인하고 다시 시도해주세요.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0A06]" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
            disabled={isStarting}
          >
            <Text style={styles.backText}>← 돌아가기</Text>
          </Pressable>

          <View style={styles.sceneContainer}>
            <Text style={styles.sceneText}>
              따뜻한 햇빛이 창을 통해 들어오는 아늑한 방,{"\n"}
              눈앞에는 마르고 인자한 인상의 노인이{"\n"}
              책을 펴고 나를 바라보고 있다.{"\n\n"}
              노인은 낮고 믿음이 가는 말투로 물었다.
            </Text>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                &quot;너는… 이제부터 그란시스 가문의 새로운 이름을 가진다.{"\n"}
                원하는 이름이 있느냐?&quot;
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>그란시스 ___</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={(text) => {
                setPlayerName(text);
                setError('');
              }}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#3D2E14"
              maxLength={10}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStart}
              editable={!isStarting}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              (!playerName.trim() || isStarting) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleStart}
            disabled={!playerName.trim() || isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#C4962A" />
            ) : (
              <Text style={styles.confirmButtonText}>이 이름으로 시작한다</Text>
            )}
          </Pressable>

          {isStarting && (
            <Text style={styles.loadingText}>
              AI가 위대한 서사를 엮고 있습니다...{"\n"}잠시만 기다려주세요.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A06' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 24 },
  backText: { color: '#9A8B6A', fontSize: 14 },
  sceneContainer: { marginBottom: 32 },
  sceneText: { color: '#E8D9B0', fontSize: 15, lineHeight: 26, fontStyle: 'italic', marginBottom: 16 },
  speechBubble: { borderLeftWidth: 2, borderLeftColor: '#C4962A', paddingLeft: 16, paddingVertical: 8 },
  speechText: { color: '#C4962A', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  inputContainer: { marginBottom: 24 },
  inputLabel: { color: '#9A8B6A', fontSize: 13, letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: '#1A1208', borderWidth: 1, borderColor: '#3D2E14', borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14, color: '#E8D9B0', fontSize: 18, letterSpacing: 2
  },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 8 },
  confirmButton: {
    backgroundColor: '#1A1208', borderWidth: 1, borderColor: '#C4962A', paddingVertical: 16,
    paddingHorizontal: 24, borderRadius: 4, alignItems: 'center', marginBottom: 16, minHeight: 56, justifyContent: 'center'
  },
  confirmButtonText: { color: '#C4962A', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  buttonDisabled: { borderColor: '#3D2E14', opacity: 0.5 },
  buttonPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  loadingText: { color: '#9A8B6A', fontSize: 13, textAlign: 'center', lineHeight: 22 },
});
