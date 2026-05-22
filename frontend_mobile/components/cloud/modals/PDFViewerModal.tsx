import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from '@/context/I18nContext';

interface PDFViewerModalProps {
  visible: boolean;
  pdfUri: string;
  fileName: string;
  authToken?: string;
  onClose: () => void;
}

export default function PDFViewerModal({ visible, pdfUri, fileName, authToken, onClose }: PDFViewerModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && pdfUri) {
      downloadPDF();
    }
  }, [visible, pdfUri]);

  const downloadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a local file path for the PDF
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      console.log('[PDFViewer] Downloading from:', pdfUri);
      console.log('[PDFViewer] Saving to:', fileUri);

      // Download the PDF with authentication if needed
      const downloadOptions: FileSystem.DownloadOptions = authToken
        ? {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        : {};

      const downloadResult = await FileSystem.downloadAsync(pdfUri, fileUri, downloadOptions);

      if (downloadResult.status === 200) {
        console.log('[PDFViewer] Download successful');

        // For iOS, we can use file:// directly
        if (Platform.OS === 'ios') {
          setLocalUri(downloadResult.uri);
        } else {
          // For Android, read as base64 and embed in HTML
          const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    overflow: hidden;
                    background-color: #06071D;
                  }
                  iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                  }
                </style>
              </head>
              <body>
                <iframe src="data:application/pdf;base64,${base64}"></iframe>
              </body>
            </html>
          `;

          setLocalUri(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        }
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (err: any) {
      console.error('[PDFViewer] Error:', err);
      setError(err.message || t('cloud.modals.pdfViewer.loadError'));
      Alert.alert(t('common.error'), t('cloud.modals.pdfViewer.loadError'));
    } finally {
      setLoading(false);
    }
  };

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
              <Text style={styles.loadingText}>{t('cloud.modals.pdfViewer.loading')}</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!error && localUri && (
            <WebView
              source={{ uri: localUri }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('[PDFViewer] WebView error:', nativeEvent);
                setError(t('cloud.modals.pdfViewer.webviewError'));
                setLoading(false);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              originWhitelist={['*']}
            />
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06071D',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
