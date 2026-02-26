import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCoachMarks } from '@/features/coach-marks/CoachMarksContext';

export default function CoachMarksOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isActive,
    currentIndex,
    steps,
    currentStep,
    targets,
    nextStep,
    previousStep,
    skipTour,
    finishTour,
  } = useCoachMarks();

  const screen = Dimensions.get('window');

  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }

    if (pathname !== currentStep.routePathname) {
      router.push(currentStep.routeHref as any);
    }
  }, [isActive, currentStep?.id, pathname]);

  const target = currentStep ? targets[currentStep.targetKey] : undefined;
  const isOnExpectedRoute = !!currentStep && pathname === currentStep.routePathname;
  const isLastStep = currentIndex === steps.length - 1;
  const spotlightTarget = isOnExpectedRoute && target ? target : null;
  const spotlightPadding = 8;

  const cardPosition = useMemo(() => {
    if (!target) {
      return {
        top: screen.height * 0.55,
        left: 16,
        right: 16,
      };
    }

    const cardTop = target.y + target.height + 12;
    const fitsBelow = cardTop + 180 < screen.height - 20;

    if (fitsBelow) {
      return {
        top: cardTop,
        left: 16,
        right: 16,
      };
    }

    return {
      top: Math.max(16, target.y - 190),
      left: 16,
      right: 16,
    };
  }, [target, screen.height]);

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="box-none">
        {spotlightTarget ? (
          <>
            <Pressable
              style={[
                styles.backdropPart,
                {
                  top: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, spotlightTarget.y - spotlightPadding),
                },
              ]}
            />
            <Pressable
              style={[
                styles.backdropPart,
                {
                  top: Math.max(0, spotlightTarget.y - spotlightPadding),
                  left: 0,
                  width: Math.max(0, spotlightTarget.x - spotlightPadding),
                  height: spotlightTarget.height + spotlightPadding * 2,
                },
              ]}
            />
            <Pressable
              style={[
                styles.backdropPart,
                {
                  top: Math.max(0, spotlightTarget.y - spotlightPadding),
                  left: spotlightTarget.x + spotlightTarget.width + spotlightPadding,
                  right: 0,
                  height: spotlightTarget.height + spotlightPadding * 2,
                },
              ]}
            />
            <Pressable
              style={[
                styles.backdropPart,
                {
                  top: spotlightTarget.y + spotlightTarget.height + spotlightPadding,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
              ]}
            />
          </>
        ) : (
          <Pressable style={styles.backdrop} />
        )}

        {spotlightTarget ? (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.spotlightHalo,
                {
                  top: spotlightTarget.y - 14,
                  left: spotlightTarget.x - 14,
                  width: spotlightTarget.width + 28,
                  height: spotlightTarget.height + 28,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.highlight,
                {
                  top: spotlightTarget.y - spotlightPadding,
                  left: spotlightTarget.x - spotlightPadding,
                  width: spotlightTarget.width + spotlightPadding * 2,
                  height: spotlightTarget.height + spotlightPadding * 2,
                },
              ]}
            />
          </>
        ) : null}

        <View style={[styles.card, cardPosition]}>
          <View style={styles.cardHeader}>
            <View style={styles.stepPill}>
              <Ionicons name="sparkles-outline" size={14} color="#E6E8FF" />
              <Text style={styles.stepPillText}>
                Etape {currentIndex + 1}/{steps.length}
              </Text>
            </View>
            <TouchableOpacity
              testID="coach-skip-button"
              onPress={() => void skipTour()}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#D9DEFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.message}>{currentStep.message}</Text>

          {!isOnExpectedRoute || !target ? (
            <View style={styles.routeInfo}>
              <ActivityIndicator size="small" color="#C8CEFF" />
              <Text style={styles.routeInfoText}>
                {!isOnExpectedRoute
                  ? 'Ouverture de la page correspondante...'
                  : 'Recherche de la zone a mettre en avant...'}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={currentIndex === 0 ? () => void skipTour() : previousStep}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                {currentIndex === 0 ? 'Passer' : 'Precedent'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                if (isLastStep) {
                  void finishTour().then(() => {
                    router.replace('/(tabs)/dashboard');
                  });
                } else {
                  nextStep();
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{isLastStep ? 'Terminer' : 'Suivant'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 6, 24, 0.76)',
  },
  backdropPart: {
    position: 'absolute',
    backgroundColor: 'rgba(4, 6, 24, 0.82)',
  },
  spotlightHalo: {
    position: 'absolute',
    borderRadius: 18,
    backgroundColor: 'rgba(126,136,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(126,136,255,0.25)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#8B93FF',
    backgroundColor: 'rgba(126,136,255,0.03)',
    shadowColor: '#7E88FF',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#12153B',
    borderWidth: 1,
    borderColor: '#2E377B',
    borderRadius: 16,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1E4B',
    borderWidth: 1,
    borderColor: '#323B85',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepPillText: {
    color: '#E6E8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1E4B',
    borderWidth: 1,
    borderColor: '#2B3370',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  message: {
    color: '#C3C9EC',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#191D48',
    borderWidth: 1,
    borderColor: '#2C3473',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  routeInfoText: {
    color: '#D7DBFF',
    fontSize: 12,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#171A3E',
    borderColor: '#2A316A',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#D7DCFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
