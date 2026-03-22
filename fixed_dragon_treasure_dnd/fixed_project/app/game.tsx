import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image, ImageBackground, Dimensions,
  Platform, KeyboardAvoidingView, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useGame } from '@/lib/game-context';
import { trpc } from '@/lib/trpc';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Memoized Typing Text for Performance
const TypingText = React.memo(({ text, speed = 25, onComplete }: { text: string, speed?: number, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed]);

  return <Text style={styles.narrationText}>{displayedText}</Text>;
});

TypingText.displayName = 'TypingText';

export default function GameScreen() {
  const router = useRouter();
  const { gameState, updateGameState, clearGame } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const actionMutation = trpc.game.action.useMutation();

  // CRITICAL: Rendering Guard - If state is missing, show loading or redirect
  if (!gameState) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C4962A" />
        <Text style={{ color: '#C4962A', marginTop: 20 }}>운명의 서사를 불러오는 중...</Text>
      </View>
    );
  }

  const handleAction = async (choice: { id: string, text: string, type?: string }) => {
    if (isProcessing) return;

    let input = choice.text;
    if (choice.type === 'direct_input') {
      if (!textInput.trim()) return;
      input = textInput;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);
    setTextInput('');
    setShowInput(false);

    try {
      const result = await actionMutation.mutateAsync({
        playerInput: input,
        messageHistory: gameState.messageHistory || [],
        currentState: gameState,
      });

      if (result.success && result.gameResponse) {
        updateGameState(result.gameResponse, result.newMessageHistory || []);
      } else {
        Alert.alert("운명의 오류", "이야기가 잠시 끊겼습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error('Action error:', error);
      Alert.alert("연결 오류", "서사 작가와의 연결이 원활하지 않습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExit = () => {
    Alert.alert(
      "모험 중단",
      "현재까지의 진행 상황은 자동으로 저장됩니다. 여관으로 돌아가시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "돌아가기", onPress: () => router.replace('/' as any) }
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0A06]" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLocation}>{gameState.location.city} - {gameState.location.district}</Text>
            <Text style={styles.headerTime}>탈라즘력 {gameState.time.year}년 {gameState.time.day}일 {gameState.time.hour}시</Text>
          </View>
          <Pressable onPress={handleExit} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>여관으로</Text>
          </Pressable>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Illustration Area */}
          <View style={styles.illustrationContainer}>
            {gameState.currentIllustrationUrl ? (
              <Image 
                source={{ uri: gameState.currentIllustrationUrl }} 
                style={styles.illustration}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.illustrationPlaceholder}>
                <ActivityIndicator color="#3D2E14" />
                <Text style={styles.placeholderText}>장면을 그리는 중...</Text>
              </View>
            )}
          </View>

          {/* Narration Area */}
          <View style={styles.narrationContainer}>
            <TypingText 
              text={gameState.messageHistory[gameState.messageHistory.length - 1]?.content ? 
                (() => {
                  try {
                    const lastMsg = gameState.messageHistory[gameState.messageHistory.length - 1].content;
                    const parsed = typeof lastMsg === 'string' ? JSON.parse(lastMsg) : lastMsg;
                    return parsed.narration || "서사가 이어집니다...";
                  } catch { return "운명의 서사가 다시 쓰여집니다."; }
                })() : "모험이 시작되었습니다."
              } 
              onComplete={() => {}}
            />
          </View>

          {/* Status Bar */}
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>체력: {gameState.status.health}</Text>
            <Text style={styles.statusText}>피로도: {gameState.status.fatigue}</Text>
            <Text style={styles.statusText}>감정: {gameState.status.emotion}</Text>
          </View>
        </ScrollView>

        {/* Action Area */}
        <View style={styles.actionArea}>
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#C4962A" />
              <Text style={styles.loadingText}>AI가 다음 장면을 구상 중입니다...</Text>
            </View>
          ) : (
            <View style={styles.choicesContainer}>
              {showInput ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder="당신의 행동을 입력하세요..."
                    placeholderTextColor="#3D2E14"
                    autoFocus
                  />
                  <Pressable 
                    style={styles.sendButton}
                    onPress={() => handleAction({ id: 'direct', text: textInput, type: 'direct_input' })}
                  >
                    <Text style={styles.sendButtonText}>전송</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowInput(false)} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>X</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.choicesGrid}>
                  <Pressable 
                    style={styles.choiceButton}
                    onPress={() => setShowInput(true)}
                  >
                    <Text style={styles.choiceButtonText}>직접 입력하기</Text>
                  </Pressable>
                  {/* Additional choices from last response could be mapped here */}
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A06' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1A1208'
  },
  headerLocation: { color: '#C4962A', fontSize: 14, fontWeight: 'bold' },
  headerTime: { color: '#6B5A3E', fontSize: 12, marginTop: 2 },
  exitButton: { padding: 8, backgroundColor: '#1A1208', borderRadius: 4, borderWidth: 1, borderColor: '#3D2E14' },
  exitButtonText: { color: '#6B5A3E', fontSize: 11 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  illustrationContainer: { 
    width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', 
    backgroundColor: '#1A1208', marginBottom: 20, borderWidth: 1, borderColor: '#3D2E14'
  },
  illustration: { width: '100%', height: '100%' },
  illustrationPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#3D2E14', fontSize: 12, marginTop: 10 },
  narrationContainer: { marginBottom: 30 },
  narrationText: { color: '#E8D9B0', fontSize: 16, lineHeight: 28, textAlign: 'justify' },
  statusBar: { 
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, 
    backgroundColor: '#1A1208', borderRadius: 8, borderWidth: 1, borderColor: '#3D2E14'
  },
  statusText: { color: '#9A8B6A', fontSize: 11 },
  actionArea: { padding: 20, borderTopWidth: 1, borderTopColor: '#1A1208', backgroundColor: '#0D0A06' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
  loadingText: { color: '#6B5A3E', fontSize: 13, marginLeft: 10 },
  choicesContainer: { width: '100%' },
  choicesGrid: { width: '100%' },
  choiceButton: { 
    backgroundColor: '#1A1208', borderWidth: 1, borderColor: '#C4962A', 
    paddingVertical: 14, borderRadius: 4, alignItems: 'center' 
  },
  choiceButtonText: { color: '#C4962A', fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  textInput: { 
    flex: 1, backgroundColor: '#1A1208', borderWidth: 1, borderColor: '#3D2E14', 
    borderRadius: 4, padding: 12, color: '#E8D9B0', marginRight: 10 
  },
  sendButton: { backgroundColor: '#C4962A', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 4 },
  sendButtonText: { color: '#0D0A06', fontWeight: 'bold' },
  cancelButton: { marginLeft: 10, padding: 10 },
  cancelButtonText: { color: '#6B5A3E', fontSize: 18 }
});
