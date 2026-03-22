import { useState } from "react";
import {
  View, Text, Pressable, FlatList, ScrollView, StyleSheet, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import type { DiaryEntry } from "@/shared/game-types";

export default function DiaryScreen() {
  const router = useRouter();
  const { gameState } = useGame();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [readAllMode, setReadAllMode] = useState(false);

  const diary = gameState?.diary || [];

  const renderEntry = ({ item }: { item: DiaryEntry }) => (
    <Pressable
      style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}
      onPress={() => setSelectedEntry(item)}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>
          탈라즘력 {item.year}년 {item.day}일
        </Text>
      </View>
      <Text style={styles.entryTitle}>{item.title}</Text>
      <Text style={styles.entryPreview} numberOfLines={2}>
        {item.content}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← 돌아가기</Text>
          </Pressable>
          <Text style={styles.title}>일대기</Text>
          {diary.length > 1 && (
            <Pressable
              style={({ pressed }) => [styles.readAllButton, pressed && { opacity: 0.6 }]}
              onPress={() => setReadAllMode(true)}
            >
              <Text style={styles.readAllText}>전체 읽기</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.divider} />

        {/* Diary entries */}
        {diary.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>아직 기록이 없습니다</Text>
            <Text style={styles.emptyText}>
              수면을 취하면 하루의 이야기가{'\n'}일대기에 기록됩니다.
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...diary].reverse()}
            keyExtractor={(item, index) => `${item.year}-${item.day}-${index}`}
            renderItem={renderEntry}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Single Entry Modal */}
      <Modal visible={!!selectedEntry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.entryModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEntry && (
                <>
                  <Text style={styles.modalDate}>
                    탈라즘력 {selectedEntry.year}년 {selectedEntry.day}일
                  </Text>
                  <Text style={styles.modalTitle}>{selectedEntry.title}</Text>
                  <View style={styles.modalDivider} />
                  <Text style={styles.modalContent}>{selectedEntry.content}</Text>
                </>
              )}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedEntry(null)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Read All Modal */}
      <Modal visible={readAllMode} transparent animationType="fade">
        <View style={styles.readAllOverlay}>
          <View style={styles.readAllModal}>
            <Text style={styles.readAllModalTitle}>
              그란시스 {gameState?.playerName}의 이야기
            </Text>
            <View style={styles.modalDivider} />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.readAllScroll}>
              {diary.map((entry, index) => (
                <View key={index} style={styles.readAllEntry}>
                  <Text style={styles.readAllEntryDate}>
                    탈라즘력 {entry.year}년 {entry.day}일
                  </Text>
                  <Text style={styles.readAllEntryTitle}>{entry.title}</Text>
                  <Text style={styles.readAllEntryContent}>{entry.content}</Text>
                  {index < diary.length - 1 && (
                    <View style={styles.entrySeparator} />
                  )}
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setReadAllMode(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A06',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingRight: 12,
  },
  backText: {
    color: '#9A8B6A',
    fontSize: 14,
  },
  title: {
    flex: 1,
    color: '#C4962A',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  readAllButton: {
    paddingLeft: 12,
  },
  readAllText: {
    color: '#9A8B6A',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#3D2E14',
    marginHorizontal: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#1A1208',
    borderWidth: 1,
    borderColor: '#3D2E14',
    borderRadius: 4,
    padding: 16,
  },
  entryCardPressed: {
    backgroundColor: '#241A0C',
    opacity: 0.8,
  },
  entryHeader: {
    marginBottom: 6,
  },
  entryDate: {
    color: '#9A8B6A',
    fontSize: 11,
    letterSpacing: 1,
  },
  entryTitle: {
    color: '#C4962A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  entryPreview: {
    color: '#9A8B6A',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#9A8B6A',
    fontSize: 16,
    marginBottom: 12,
  },
  emptyText: {
    color: '#3D2E14',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  entryModal: {
    backgroundColor: '#1A1208',
    borderTopWidth: 1,
    borderTopColor: '#3D2E14',
    padding: 24,
    maxHeight: '80%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalDate: {
    color: '#9A8B6A',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#C4962A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#3D2E14',
    marginBottom: 16,
  },
  modalContent: {
    color: '#E8D9B0',
    fontSize: 15,
    lineHeight: 28,
    fontStyle: 'italic',
    paddingBottom: 24,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3D2E14',
    borderRadius: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#9A8B6A',
    fontSize: 14,
  },
  // Read all modal
  readAllOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 16,
  },
  readAllModal: {
    backgroundColor: '#1A1208',
    borderWidth: 1,
    borderColor: '#3D2E14',
    borderRadius: 8,
    padding: 24,
    maxHeight: '90%',
  },
  readAllModalTitle: {
    color: '#C4962A',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  readAllScroll: {
    maxHeight: '80%',
  },
  readAllEntry: {
    marginBottom: 8,
  },
  readAllEntryDate: {
    color: '#9A8B6A',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  readAllEntryTitle: {
    color: '#C4962A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  readAllEntryContent: {
    color: '#E8D9B0',
    fontSize: 14,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  entrySeparator: {
    height: 1,
    backgroundColor: '#3D2E14',
    marginVertical: 20,
  },
});
