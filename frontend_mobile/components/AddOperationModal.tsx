import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

interface AddOperationModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onManualEntry: () => void;
  readonly onPdfInsert: () => void;
}

export default function AddOperationModal({
  visible,
  onClose,
  onManualEntry,
  onPdfInsert,
}: AddOperationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeIcon}>
              <View style={styles.closeBar1} />
              <View style={styles.closeBar2} />
            </View>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Nouvelle opération</Text>

          {/* Manual Entry Button */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={onManualEntry}
            activeOpacity={0.7}
          >
            <Text style={styles.manualButtonText}>Saisir manuellement</Text>
          </TouchableOpacity>

          {/* Divider */}
          <Text style={styles.divider}>OU</Text>

          {/* PDF Insert Button */}
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={onPdfInsert}
            activeOpacity={0.7}
          >
            <Text style={styles.pdfButtonText}>Insérer PDF</Text>
            <View style={styles.plusIcon}>
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBar1: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#000000',
    transform: [{ rotate: '45deg' }],
  },
  closeBar2: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#000000',
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    color: '#000000',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 8,
  },
  manualButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#000000',
  },
  divider: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#000000',
  },
  pdfButton: {
    backgroundColor: '#11112A',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  plusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 12,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    width: 1.5,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});
