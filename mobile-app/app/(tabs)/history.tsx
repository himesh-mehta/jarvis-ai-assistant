import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Animated, useWindowDimensions,
  Platform, TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/auth';
import { API_URL } from '../../constants/config';
import Sidebar from '../../components/Sidebar';

export default function HistoryScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    if (user) syncHistory();
  }, [user]);

  const syncHistory = async () => {
    if (!user) return;
    setIsHistoryLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.sessions) {
        setChatHistory(data.sessions.map((s: any) => ({
          id: s.sessionId,
          title: s.title,
          updatedAt: s.updatedAt
        })));
      }
    } catch (error) {
      console.error("[History Screen Sync Error]", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chatHistory;
    return chatHistory.filter(chat => 
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatHistory, searchQuery]);

  const formatDateTime = (chat: any) => {
    if (chat.updatedAt) {
      const d = new Date(chat.updatedAt);
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return { date: dateStr, time: timeStr };
    }
    return { date: "10 MAR 2026", time: "14:17" };
  };

  const handlePinChat = async (id: string) => {
    if (!user) return;
    const chat = chatHistory.find(c => c.id === id);
    const newPinned = !chat?.pinned;

    // Update locally
    setChatHistory(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, pinned: newPinned } : c
      );
      // Sort: pinned first, then by date (if available)
      return updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    });

    try {
      const token = await user.getIdToken();
      await fetch(`${API_URL}/api/history`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: id, pinned: newPinned })
      });
    } catch (e) {
      console.error("[Pin Error]", e);
    }
  };

  const handleRenameChat = async (id: string) => {
    if (!user) return;
    const currentChat = chatHistory.find(c => c.id === id);
    Alert.prompt(
      "Rename Transmission",
      "Enter new designation",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Update", onPress: (val) => val && updateChatTitle(id, val) }
      ],
      "plain-text",
      currentChat?.title
    );
  };

  const updateChatTitle = async (id: string, newTitle: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`${API_URL}/api/history`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: id, title: newTitle })
      });
      setChatHistory(prev => prev.map(chat => 
        chat.id === id ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error("[Rename Error]", error);
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: id })
      });
      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== id));
      }
    } catch (error) {
      console.error("[Delete Error]", error);
      Alert.alert("Error", "Failed to delete transmission");
    }
  };

  const showChatOptions = (item: any, pageY: number) => {
    setSelectedItem(item);
    // Position it slightly below the button
    setMenuPosition({ top: pageY + 10, right: 30 });
    setShowOptionsMenu(true);
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const { date, time } = formatDateTime(item);

    return (
      <TouchableOpacity 
        style={styles.chatCard}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/chat',
            params: { sessionId: item.id, title: item.title }
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="chat-processing-outline" size={24} color={Colors.neonBlue} />
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.chatTitle} numberOfLines={1}>{item.title || "Untitled Transmission"}</Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.3)" />
                <Text style={styles.metaText}>{date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={12} color="rgba(255,255,255,0.3)" />
                <Text style={styles.metaText}>{time}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.moreBtn}
          onPress={(e) => {
            // Get the Y position of the touch to anchor the menu
            const { pageY } = e.nativeEvent;
            showChatOptions(item, pageY);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, Platform.OS === 'ios' ? 50 : 40) }]}>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
        
        {!showSearch ? (
          <>
            <Text style={styles.headerTitle}>CHATS</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.headerIconBtn}>
                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.neonBlue} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transmissions..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isHistoryLoading && chatHistory.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={Colors.neonBlue} size="large" />
              <Text style={styles.loadingText}>Retrieving Database...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isHistoryLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="server-outline" size={48} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyStateText}>No transmission packets found</Text>
            </View>
          ) : null
        }
      />

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => router.push({ pathname: '/(tabs)/chat', params: { new: 'true' } })}
        onSelectChat={(id, title) => {
          router.push({ pathname: '/(tabs)/chat', params: { sessionId: id, title: title } });
          setIsSidebarOpen(false);
        }}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        recentChats={chatHistory}
        isHistoryLoading={isHistoryLoading}
        activeSessionId={sessionId || ""}
        onVoicePress={() => {
          router.push({ pathname: '/(tabs)/chat', params: { voice: 'true' } });
          setIsSidebarOpen(false);
        }}
      />

      {/* Custom Options Menu - Anchored Popup */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[styles.optionsMenu, { top: menuPosition.top, right: menuPosition.right }]}>
            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: 'rgba(255,255,255,0.05)', borderTopLeftRadius: 12, borderTopRightRadius: 12 }]}
              onPress={() => {
                setShowOptionsMenu(false);
                Alert.prompt(
                  "Rename Transmission",
                  "Enter new designation",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Update", onPress: (val: string | undefined) => val && updateChatTitle(selectedItem.id, val) }
                  ],
                  "plain-text",
                  selectedItem?.title
                );
              }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.neonBlue} />
              <Text style={styles.optionText}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handlePinChat(selectedItem.id);
              }}
            >
              <MaterialCommunityIcons name="pin-outline" size={20} color="#BF36FF" />
              <Text style={styles.optionText}>{selectedItem?.pinned ? "Unpin" : "Pin"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setShowOptionsMenu(false);
                Alert.alert("Purge Confirmation", "Permanently delete this record?", [
                  { text: "Abort", style: "cancel" },
                  { text: "Purge", style: "destructive", onPress: () => handleDeleteChat(selectedItem.id) }
                ]);
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="rgba(255,255,255,0.4)" />
              <Text style={[styles.optionText, { color: '#FF4D4D' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020b1c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuBtn: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerIconBtn: {
    padding: 5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  listContent: {
    padding: 12,
    gap: 15,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 210, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.1)',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '600',
  },
  moreBtn: {
    padding: 8,
  },
  loadingState: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 14,
    marginTop: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  optionsMenu: {
    position: 'absolute',
    backgroundColor: '#050a14',
    borderRadius: 12,
    padding: 4,
    width: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  optionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
