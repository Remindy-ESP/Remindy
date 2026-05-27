import React, { useEffect, useRef } from 'react';
import { InteractionManager, View, type ViewProps } from 'react-native';
import { useOptionalCoachMarks } from '@/features/coach-marks/CoachMarksContext';

type Props = ViewProps & {
  targetKey: string;
};

export default function CoachMarkTarget({ targetKey, children, ...viewProps }: Props) {
  const ref = useRef<View>(null);
  const coachMarks = useOptionalCoachMarks();
  const lastLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const isMeasuringRef = useRef(false);
  const registerTarget = coachMarks?.registerTarget;
  const unregisterTarget = coachMarks?.unregisterTarget;
  const isActive = coachMarks?.isActive ?? false;
  const currentStepTargetKey = coachMarks?.currentStep?.targetKey;
  const shouldMeasure = isActive && currentStepTargetKey === targetKey;

  const measureTarget = () => {
    if (!registerTarget || !shouldMeasure || isMeasuringRef.current) {
      return;
    }

    isMeasuringRef.current = true;
    ref.current?.measureInWindow((x, y, width, height) => {
      isMeasuringRef.current = false;

      if (!width || !height) {
        return;
      }

      const nextLayout = {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      };

      const previous = lastLayoutRef.current;
      if (
        previous &&
        Math.abs(previous.x - nextLayout.x) <= 1 &&
        Math.abs(previous.y - nextLayout.y) <= 1 &&
        Math.abs(previous.width - nextLayout.width) <= 1 &&
        Math.abs(previous.height - nextLayout.height) <= 1
      ) {
        return;
      }

      lastLayoutRef.current = nextLayout;
      registerTarget(targetKey, nextLayout);
    });
  };

  useEffect(() => {
    if (!registerTarget || !unregisterTarget) {
      return;
    }

    if (!shouldMeasure) {
      return () => {
        unregisterTarget(targetKey);
      };
    }

    const task = InteractionManager.runAfterInteractions(() => {
      measureTarget();
    });

    return () => {
      task.cancel();
      unregisterTarget(targetKey);
    };
  }, [targetKey, registerTarget, unregisterTarget, shouldMeasure]);

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={event => {
        viewProps.onLayout?.(event);
        if (shouldMeasure) {
          measureTarget();
        }
      }}
      {...viewProps}
    >
      {children}
    </View>
  );
}
