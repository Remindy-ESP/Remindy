import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';

export interface ActionSheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  cancel?: boolean;
}

interface ActionSheetState {
  title?: string;
  actions: ActionSheetAction[];
}

interface ActionSheetContextValue {
  showActionSheet: (state: ActionSheetState) => void;
}

const ActionSheetContext = createContext<ActionSheetContextValue>({ showActionSheet: () => {} });

let _showActionSheet: ((state: ActionSheetState) => void) | null = null;

export function showActionSheet(state: ActionSheetState) {
  _showActionSheet?.(state);
}

export function ActionSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActionSheetState | null>(null);

  const show = useCallback((s: ActionSheetState) => setState(s), []);
  _showActionSheet = show;

  const dismiss = () => setState(null);

  return (
    <ActionSheetContext.Provider value={{ showActionSheet: show }}>
      {children}
      {state && (
        <Modal visible transparent animationType="slide" onRequestClose={dismiss}>
          <Pressable style={styles.overlay} onPress={dismiss}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              {state.title && <Text style={styles.title}>{state.title}</Text>}
              {state.actions.filter((a) => !a.cancel).map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.action, action.destructive && styles.destructiveAction]}
                  onPress={() => { action.onPress(); dismiss(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, action.destructive && styles.destructiveText]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.action, styles.cancelAction]} onPress={dismiss} activeOpacity={0.7}>
                <Text style={styles.cancelText}>
                  {state.actions.find((a) => a.cancel)?.label ?? 'Annuler'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ActionSheetContext.Provider>
  );
}

export function useActionSheet() {
  return useContext(ActionSheetContext).showActionSheet;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1B1B3A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#2E356F',
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  title: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252545',
    marginBottom: 4,
  },
  action: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252545',
    alignItems: 'center',
  },
  destructiveAction: {},
  cancelAction: {
    marginTop: 8,
    borderBottomWidth: 0,
    borderRadius: 12,
    backgroundColor: '#252545',
  },
  actionText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#f87171',
    fontWeight: '600',
  },
  cancelText: {
    color: '#cbd5f5',
    fontSize: 16,
    fontWeight: '600',
  },
});
