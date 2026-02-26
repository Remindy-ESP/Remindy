import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import onboardingService from '@/services/local/onboarding.service';
import { DEFAULT_COACH_MARK_STEPS, type CoachMarkStep } from './coach-marks.config';

type CoachMarkTargetLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CoachMarksContextValue = {
  isActive: boolean;
  currentIndex: number;
  steps: CoachMarkStep[];
  currentStep: CoachMarkStep | null;
  targets: Record<string, CoachMarkTargetLayout>;
  registerTarget: (key: string, layout: CoachMarkTargetLayout) => void;
  unregisterTarget: (key: string) => void;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => Promise<void>;
  finishTour: () => Promise<void>;
};

const CoachMarksContext = createContext<CoachMarksContextValue | undefined>(undefined);

export function CoachMarksProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targets, setTargets] = useState<Record<string, CoachMarkTargetLayout>>({});

  const steps = DEFAULT_COACH_MARK_STEPS;
  const currentStep = isActive ? (steps[currentIndex] ?? null) : null;

  const registerTarget = useCallback((key: string, layout: CoachMarkTargetLayout) => {
    setTargets(prev => {
      const existing = prev[key];
      const nextLayout = {
        x: Math.round(layout.x),
        y: Math.round(layout.y),
        width: Math.round(layout.width),
        height: Math.round(layout.height),
      };

      if (
        existing &&
        Math.abs(existing.x - nextLayout.x) <= 1 &&
        Math.abs(existing.y - nextLayout.y) <= 1 &&
        Math.abs(existing.width - nextLayout.width) <= 1 &&
        Math.abs(existing.height - nextLayout.height) <= 1
      ) {
        return prev;
      }

      return {
        ...prev,
        [key]: nextLayout,
      };
    });
  }, []);

  const unregisterTarget = useCallback((key: string) => {
    setTargets(prev => {
      if (!(key in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const startTour = useCallback(() => {
    setCurrentIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev >= steps.length - 1) {
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const previousStep = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
  }, []);

  const stopAndPersistSeen = useCallback(async () => {
    await onboardingService.setHasSeenOnboarding(true);
    setIsActive(false);
  }, []);

  const skipTour = useCallback(async () => {
    await stopAndPersistSeen();
  }, [stopAndPersistSeen]);

  const finishTour = useCallback(async () => {
    await stopAndPersistSeen();
  }, [stopAndPersistSeen]);

  const value = useMemo<CoachMarksContextValue>(
    () => ({
      isActive,
      currentIndex,
      steps,
      currentStep,
      targets,
      registerTarget,
      unregisterTarget,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      finishTour,
    }),
    [isActive, currentIndex, steps, currentStep, targets],
  );

  return <CoachMarksContext.Provider value={value}>{children}</CoachMarksContext.Provider>;
}

export function useCoachMarks() {
  const context = useContext(CoachMarksContext);
  if (!context) {
    throw new Error('useCoachMarks must be used within CoachMarksProvider');
  }
  return context;
}

export function useOptionalCoachMarks() {
  return useContext(CoachMarksContext);
}
