import { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, Animated, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function WorldIntroScreen() {
  const router = useRouter();
  const [introData, setIntroData] = useState<{ title: string; content: string } | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  
  const introMutation = trpc.game.generateWorldIntro.useMutation();

  useEffect(() => {
    const fetchIntro = async () => {
      try {
        const data = await introMutation.mutateAsync();
        setIntroData(data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        setIntroData({
          title: "제국의 서막",
          content: "탈라즘 제국의 법과 질서가 대륙을 지배하고 있습니다. 하지만 그 이면에는 잊혀진 용의 시대의 유산인 '보물'들이 숨겨져 있습니다. 이제 당신의 모험이 시작됩니다."
        });
      }
    };
    fetchIntro();
  }, []);

  useEffect(() => {
    if (introData && !isTyping) {
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        setDisplayedContent(introData.content.slice(0, index));
        index++;
        if (index > introData.content.length) {
          clearInterval(interval);
          setIsTyping(false);
          Animated.timing(buttonFade, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [introData]);

  const handleNext = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/name-input' as any);
  };

  if (!introData) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C4962A" />
          <Text style={styles.loadingText}>AI가 세계관의 문을 열고 있습니다...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{introData.title}</Text>
        <View style={styles.divider} />
        
        <ScrollView 
          style={styles.contentScroll}
          contentContainerStyle={styles.contentPadding}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.content}>
            {displayedContent}
            {isTyping && <Text style={styles.cursor}>|</Text>}
          </Text>
        </ScrollView>

        <Animated.View style={{ opacity: buttonFade }}>
          <Pressable
            style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>운명을 향해 나아가기</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    color: '#9A8B6A',
    fontSize: 14,
    fontStyle: 'italic',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    color: '#C4962A',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  divider: {
    width: '40%',
    height: 1,
    backgroundColor: '#3D2E14',
    alignSelf: 'center',
    marginBottom: 30,
  },
  contentScroll: {
    flex: 1,
    marginBottom: 20,
  },
  contentPadding: {
    paddingBottom: 40,
  },
  content: {
    color: '#E8D9B0',
    fontSize: 16,
    lineHeight: 30,
    textAlign: 'justify',
    fontStyle: 'italic',
  },
  cursor: {
    color: '#C4962A',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#1A1208',
    borderWidth: 1,
    borderColor: '#C4962A',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#C4962A',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
