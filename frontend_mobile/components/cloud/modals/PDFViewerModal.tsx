import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface PDFViewerModalProps {
  visible: boolean;
  pdfUri: string;
  fileName: string;
  onClose: () => void;
}

export default function PDFViewerModal({ visible, pdfUri, fileName, onClose }: PDFViewerModalProps) {
  const [loading, setLoading] = React.useState(true);

  // For web platform, use Google Docs viewer or direct PDF
  const viewerUri = Platform.select({
    web: pdfUri,
    // For mobile, we need to use a PDF viewer service or load the file directly
    default: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUri)}`,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* PDF Viewer */}
        <View style={styles.pdfContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Chargement du PDF...</Text>
            </View>
          )}

          <WebView
            source={{ uri: viewerUri }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setLoading(false);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06071D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F1F39',
    borderBottomWidth: 1,
    borderBottomColor: '#373848',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  closeButton: {
    padding: 4,
  },
  fileName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  placeholder: {
    width: 36,
  },
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#06071D',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06071D',
    zIndex: 1,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
  },
});
