import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface AudioVoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSendTranscript?: (transcript: string) => void;
}

export const AudioVoiceModal: React.FC<AudioVoiceModalProps> = ({
  visible,
  onClose,
  onSendTranscript,
}) => {
  const [status, setStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('Listening to your voice...');

  useEffect(() => {
    if (!visible) return;

    // Start pulsing animation loop
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Voice lifecycle simulation
    const t1 = setTimeout(() => {
      setStatus('thinking');
      setTranscript('"Can you explain how a mortgage amortization works?"');
    }, 3500);

    const t2 = setTimeout(() => {
      setStatus('speaking');
      setTranscript(
        'MortX: "Of course! A mortgage amortization breaks down each monthly payment into principal repayment and interest charges. In the early years, the vast majority goes to interest."'
      );
    }, 5500);

    return () => {
      pulse.stop();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible, pulseAnim]);

  const handleFinish = () => {
    if (transcript.startsWith('"Can you explain') && onSendTranscript) {
      onSendTranscript('Can you explain how a mortgage amortization works?');
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.modelHeader}>MortX Voice Mode</Text>
          <Pressable onPress={handleFinish} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Center Pulsing Sphere */}
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.outerGlow,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor:
                  status === 'listening'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : status === 'thinking'
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(59, 130, 246, 0.2)',
              },
            ]}>
            <View
              style={[
                styles.voiceSphere,
                {
                  backgroundColor:
                    status === 'listening'
                      ? '#10B981'
                      : status === 'thinking'
                      ? '#8B5CF6'
                      : '#3B82F6',
                },
              ]}>
              <Ionicons
                name={
                  status === 'listening'
                    ? 'mic'
                    : status === 'thinking'
                    ? 'sync'
                    : 'volume-high'
                }
                size={38}
                color="#FFFFFF"
              />
            </View>
          </Animated.View>

          {/* Status Label */}
          <Text style={styles.statusText}>
            {status === 'listening'
              ? 'Listening...'
              : status === 'thinking'
              ? 'Thinking...'
              : 'Speaking...'}
          </Text>

          {/* Transcript Preview */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        </View>

        {/* Bottom Control Bar */}
        <View style={styles.controlBar}>
          <Pressable
            onPress={() => setIsMuted(!isMuted)}
            style={[
              styles.controlBtn,
              isMuted && { backgroundColor: '#EF4444' },
            ]}>
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable onPress={handleFinish} style={styles.endBtn}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
    justifyContent: 'space-between',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  modelHeader: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSphere: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 10,
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.four,
  },
  transcriptBox: {
    marginTop: Spacing.three,
    maxWidth: 320,
    paddingHorizontal: Spacing.three,
  },
  transcriptText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
    paddingBottom: Spacing.two,
  },
  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
