import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: async () => false });

let _confirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return _confirm?.(options) ?? Promise.resolve(false);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  _confirm = confirm;

  const handleConfirm = async () => {
    if (!state) return;
    setLoading(true);
    state.resolve(true);
    setLoading(false);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <Modal visible transparent animationType="fade" onRequestClose={handleCancel}>
          <Pressable style={styles.overlay} onPress={handleCancel}>
            <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.title}>{state.title}</Text>
              <Text style={styles.message}>{state.message}</Text>
              <View style={styles.buttons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>{state.cancelText ?? 'Annuler'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, state.destructive ? styles.destructiveButton : styles.confirmButton, loading && styles.disabled]}
                  onPress={handleConfirm}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={state.destructive ? styles.destructiveText : styles.confirmText}>
                        {state.confirmText ?? 'Confirmer'}
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2E356F',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#252545',
    borderWidth: 1,
    borderColor: '#2E356F',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  destructiveButton: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  disabled: { opacity: 0.5 },
  cancelText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  destructiveText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '700',
  },
});
