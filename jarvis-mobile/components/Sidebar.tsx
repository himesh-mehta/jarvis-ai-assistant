import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Animated, useWindowDimensions, 
  ActivityIndicator, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string, title: string) => void;
  recentChats?: { id: string; title: string; pinned?: boolean }[];
  isHistoryLoading?: boolean;
  activeSessionId?: string;
  onDeleteChat?: (id: string) => void;
  onPinChat?: (id: string) => void;
  onRenameChat?: (id: string) => void;
  onVoicePress?: () => void;
}

export default function Sidebar({ 
  isOpen, onClose, onNewChat, onSelectChat, 
  recentChats = [], isHistoryLoading = false,
  activeSessionId, onDeleteChat, onPinChat, onRenameChat,
  onVoicePress
}: SidebarProps) {

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const SIDEBAR_WIDTH = width * 0.7 > 280 ? 280 : width * 0.7;
  
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [isVisible, setIsVisible] = React.useState(isOpen);
  const { user, logout } = useAuth();
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const sheetAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (menuOpenId) {
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    } else {
      sheetAnim.setValue(300);
    }
  }, [menuOpenId]);

  React.useEffect(() => {
    if (isOpen) setIsVisible(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !isOpen) setIsVisible(false);
    });
  }, [isOpen, SIDEBAR_WIDTH]);

  if (!isVisible) return null;

  const navItems = [
    { id: 'new', label: 'New chat', icon: 'add-outline', color: 'rgba(255,255,255,0.6)' },
    { id: 'chats', label: 'Chats', icon: 'chatbubble-outline', color: 'rgba(255,255,255,0.6)' },
    { id: 'voice', label: 'Talk to Jarvis', icon: 'mic-outline', color: 'rgba(255,255,255,0.6)' },
    { id: 'command', label: 'Command to Jarvis', icon: 'flash-outline', color: 'rgba(255,255,255,0.6)' },
    { id: 'projects', label: 'Projects', icon: 'library-outline', color: 'rgba(255,255,255,0.6)' },
  ];

  return (
    <View style={styles.overlayContainer} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View 
        style={[styles.backdrop, { opacity: fadeAnim }]} 
      >
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sidebar Content */}
      <Animated.View style={[
        styles.sidebar, 
        { 
          width: SIDEBAR_WIDTH, 
          transform: [{ translateX: slideAnim }],
          paddingTop: Math.max(insets.top, 60)
        }
      ]}>
        <View style={styles.header}>
          <Text style={styles.brandTextWeb}>
            <Text style={{ color: Colors.neonBlue }}>JAR</Text>
            <Text style={{ color: Colors.neonPurple }}>VIS</Text>
          </Text>
        </View>

        <View style={styles.navSection}>
          {navItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.navItem}
              onPress={() => {
                if (item.id === 'new') onNewChat();
                if (item.id === 'voice' && onVoicePress) onVoicePress();
                if (item.id === 'command') router.replace('/(tabs)/core');
                onClose();
              }}
            >
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={styles.navLabel}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENTS</Text>
            {isHistoryLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.2)" />}
          </View>
          <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
            {recentChats.map((chat) => (
              <TouchableOpacity 
                key={chat.id} 
                style={[
                  styles.chatEntry, 
                  activeSessionId === chat.id && styles.activeChatEntry
                ]}
                onPress={() => {
                  onSelectChat(chat.id, chat.title);
                  onClose();
                }}
                onLongPress={() => {
                  setMenuOpenId(chat.id);
                }}
                delayLongPress={300}
              >
                <Text 
                  style={[
                    styles.chatTitle, 
                    activeSessionId === chat.id ? styles.activeChatTitle : styles.inactiveChatTitle
                  ]} 
                  numberOfLines={1}
                >
                  {chat.title}
                </Text>
                
                {chat.pinned && <Ionicons name="pin" size={10} color={Colors.neonBlue} style={styles.pinIcon} />}
              </TouchableOpacity>
            ))}
            {recentChats.length === 0 && !isHistoryLoading && (
              <Text style={styles.emptyHistoryText}>No recent transmissions</Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.profileBtn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.userStatus} numberOfLines={1}>
                {user?.email || 'Neural Link Active'}
              </Text>
            </View>
            <Ionicons name="settings-outline" size={16} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={() => {
              logout();
              onClose();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Bottom Sheet Menu */}
      {menuOpenId && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop} 
            activeOpacity={1} 
            onPress={() => setMenuOpenId(null)} 
          />
          <Animated.View style={[
            styles.bottomSheet,
            { transform: [{ translateY: sheetAnim }] }
          ]}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Chat Options</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.bottomSheetItem} 
              onPress={() => {
                if (menuOpenId && onPinChat) onPinChat(menuOpenId);
                setMenuOpenId(null);
              }}
            >
              <Ionicons name="bookmark-outline" size={18} color="#FFF" />
              <Text style={styles.bottomSheetText}>Pin Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bottomSheetItem} 
              onPress={() => {
                if (menuOpenId && onRenameChat) onRenameChat(menuOpenId);
                setMenuOpenId(null);
              }}
            >
              <Ionicons name="pencil-outline" size={18} color="#FFF" />
              <Text style={styles.bottomSheetText}>Rename Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bottomSheetItem} 
              onPress={() => {
                if (menuOpenId && onDeleteChat) onDeleteChat(menuOpenId);
                setMenuOpenId(null);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.bottomSheetText, { color: '#EF4444' }]}>Delete Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.bottomSheetItem, styles.cancelItem]} 
              onPress={() => setMenuOpenId(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouch: {
    flex: 1,
  },
  sidebar: {
    height: '100%',
    backgroundColor: '#020617',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    marginBottom: 15,
  },
  brandTextWeb: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
  },
  closeBtn: {
    padding: 5,
  },
  navSection: {
    paddingLeft: 1,
    gap: 1,
    marginBottom: 25,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  navLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  historySection: {
    flex: 1,
    paddingLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  historyScroll: {
    flex: 1,
  },
  chatEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 0,
  },
  activeChatEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 2,
    borderLeftColor: Colors.neonBlue,
  },
  moreOptionsBtn: {
    marginLeft: 8,
    padding: 6,
  },
  pinIcon: {
    marginLeft: 6,
    transform: [{ rotate: '45deg' }],
  },
  optionsMenu: {
    // Removed old menu styles
  },
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomSheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    width: '100%',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  bottomSheetTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
  },
  bottomSheetText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelItem: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  optionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  chatTitle: {
    fontSize: 15,
    flex: 1,
  },
  inactiveChatTitle: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  activeChatTitle: {
    color: '#FFF',
    fontWeight: '500',
  },
  emptyHistoryText: {
    color: 'rgba(255, 255, 255, 0.15)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    paddingLeft: 1,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    gap: 10,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  userStatus: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  }
});
