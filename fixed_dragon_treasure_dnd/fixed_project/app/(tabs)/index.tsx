import { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated, ImageBackground, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const { gameState } = useGame();
  const titleFade = useRef(new Animated.Value(0)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleFade, buttonsFade]);

  const handleNewGame = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/name-input' as any);
  };

  const handleContinue = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/game' as any);
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <ImageBackground
        source={require("@/assets/images/main-bg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Animated.View style={[styles.header, { opacity: titleFade }]}>
              <Text style={styles.title}>용이 감춘 보물</Text>
              <Text style={styles.subtitle}>그리고 사냥꾼</Text>
              <View style={styles.divider} />
              <Text style={styles.description}>
                탈라즘 제국의 그림자 속에서{"\n"}잊혀진 전설이 다시 숨을 쉽니다.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.buttonContainer, { opacity: buttonsFade }]}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={handleNewGame}
              >
                <Text style={styles.primaryButtonText}>이야기 속으로</Text>
              </Pressable>

              {gameState && (
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                  onPress={handleContinue}
                >
                  <Text style={styles.secondaryButtonText}>운명 이어가기</Text>
                </Pressable>
              )}

              <Text style={styles.version}>Version 1.2.0</Text>
            </Animated.View>
          </View>
        </View>
      </ImageBackground>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 10, 6, 0.6)', // 텍스트 가독성을 위한 어두운 오버레이
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    color: '#C4962A',
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: '#E8D9B0',
    fontSize: 20,
    letterSpacing: 8,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#C4962A',
    marginVertical: 24,
  },
  description: {
    color: '#9A8B6A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1A1208',
    borderWidth: 1,
    borderColor: '#C4962A',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    shadowColor: '#C4962A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryButtonText: {
    color: '#C4962A',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3D2E14',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#9A8B6A',
    fontSize: 16,
    letterSpacing: 2,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  version: {
    color: '#3D2E14',
    fontSize: 10,
    marginTop: 24,
  },
});
