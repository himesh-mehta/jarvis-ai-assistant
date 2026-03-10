import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Animated, useWindowDimensions, Image,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


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
}


export default function Sidebar({ 
  isOpen, onClose, onNewChat, onSelectChat, 
  recentChats = [], isHistoryLoading = false 
}: SidebarProps) {

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const SIDEBAR_WIDTH = width * 0.75 > 300 ? 300 : width * 0.75;
  const brandFontSize = SIDEBAR_WIDTH * 0.08 > 24 ? 24 : SIDEBAR_WIDTH * 0.08;
  
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [isVisible, setIsVisible] = React.useState(isOpen);
  const { user, logout } = useAuth();

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
    { id: 'new', label: 'New chat', icon: 'add-outline' },
    { id: 'chats', label: 'Recent Chats', icon: 'chatbubbles-outline' },
    { id: 'voice', label: 'Talk to Jarvis', icon: 'mic-outline' },
    { id: 'projects', label: 'Projects', icon: 'folder-outline' },
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
          paddingTop: Math.max(insets.top, 20)
        }
      ]}>
        <View style={styles.header}>
          <Text style={[styles.brandText, { fontSize: brandFontSize }]}>JARVIS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>


        <View style={styles.navSection}>
          {navItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.navItem}
              onPress={() => {
                if (item.id === 'new') onNewChat();
                onClose();
              }}
            >
              <Ionicons name={item.icon as any} size={20} color="rgba(255,255,255,0.6)" />
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>RECENTS</Text>
          <ScrollView style={styles.historyScroll}>
            {recentChats.map((chat) => (
              <TouchableOpacity 
                key={chat.id} 
                style={styles.chatEntry}
                onPress={() => {
                  onSelectChat(chat.id, chat.title);
                  onClose();
                }}
              >
                {chat.pinned && <Ionicons name="pin" size={12} color={Colors.jarvisNeon} style={styles.pinIcon} />}
                <Text style={styles.chatTitle} numberOfLines={1}>{chat.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.profileBtn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.[0] || 'U'}
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
            <Text style={styles.logoutText}>Logout Sequence</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    borderRightColor: 'rgba(255, 255, 255, 0.1)',

    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textShadowColor: Colors.jarvisNeon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  closeBtn: {
    padding: 5,
  },
  navSection: {
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 30,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  navLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  historyScroll: {
    flex: 1,
  },
  chatEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  pinIcon: {
    marginRight: 8,
    transform: [{ rotate: '45deg' }],
  },
  chatTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  userStatus: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  }
});
