import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from '@/shared/application/I18nContext';
import { toast } from '@/context/ToastContext';

interface PDFViewerModalProps {
  visible: boolean;
  pdfUri: string;
  fileName: string;
  mimeType?: string;
  authToken?: string;
  onClose: () => void;
}

function buildPdfJsHtml(base64: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #06071D; font-family: sans-serif; }
    #status { color: #9ca3af; text-align: center; padding: 40px 20px; font-size: 14px; }
    #pdf-render { width: 100%; }
    canvas { display: block; width: 100% !important; margin-bottom: 2px; }
  </style>
</head>
<body>
  <div id="status">Chargement...</div>
  <div id="pdf-render"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var b64 = "${base64}";
    var raw = atob(b64);
    var buf = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
    pdfjsLib.getDocument({ data: buf }).promise.then(function(pdf) {
      document.getElementById('status').style.display = 'none';
      var container = document.getElementById('pdf-render');
      var dpr = window.devicePixelRatio || 2;
      function renderPage(n) {
        pdf.getPage(n).then(function(page) {
          var baseScale = window.innerWidth / page.getViewport({ scale: 1 }).width;
          var scale = baseScale * dpr;
          var vp = page.getViewport({ scale: scale });
          var canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = window.innerWidth + 'px';
          canvas.style.height = (vp.height / dpr) + 'px';
          container.appendChild(canvas);
          page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(function() {
            if (n < pdf.numPages) renderPage(n + 1);
          });
        });
      }
      renderPage(1);
    }).catch(function(e) {
      var el = document.getElementById('status');
      el.textContent = 'Erreur : ' + e.message;
      el.style.color = '#E74C3C';
    });
  </script>
</body>
</html>`;
}

export default function PDFViewerModal({
  visible,
  pdfUri,
  fileName,
  mimeType,
  authToken,
  onClose,
}: PDFViewerModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [htmlFileUri, setHtmlFileUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isImage = (mimeType ?? '').startsWith('image/');

  useEffect(() => {
    if (visible && pdfUri) {
      loadDocument();
    }
    if (!visible) {
      setLocalUri(null);
      setHtmlFileUri(null);
      setError(null);
    }
  }, [visible, pdfUri]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      setLocalUri(null);
      setHtmlFileUri(null);

      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const downloadOptions: FileSystem.DownloadOptions = authToken
        ? { headers: { Authorization: `Bearer ${authToken}`, 'ngrok-skip-browser-warning': 'true' } }
        : {};

      const result = await FileSystem.downloadAsync(pdfUri, fileUri, downloadOptions);
      if (result.status !== 200) throw new Error(`Download failed: ${result.status}`);

      if (isImage) {
        // Images: render directly with React Native <Image> — no WebView needed
        setLocalUri(result.uri);
      } else if (Platform.OS === 'ios') {
        // iOS WKWebView renders PDF natively from file:// URI
        setLocalUri(result.uri);
      } else {
        // Android: write PDF.js HTML to a cache file to avoid large-string WebView limit
        const base64 = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const html = buildPdfJsHtml(base64);
        const htmlUri = `${FileSystem.cacheDirectory}pdfviewer_${Date.now()}.html`;
        await FileSystem.writeAsStringAsync(htmlUri, html, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setHtmlFileUri(htmlUri);
      }
    } catch (err: any) {
      console.error('[DocumentViewer] Error:', err);
      setError(err.message || t('cloud.modals.pdfViewer.loadError'));
      toast.error(t('cloud.modals.pdfViewer.loadError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>{t('cloud.modals.pdfViewer.loading')}</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.centered}>
              <Ionicons name="alert-circle" size={48} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && isImage && localUri && (
            <ScrollView
              style={styles.imageScroll}
              contentContainerStyle={styles.imageContainer}
              maximumZoomScale={5}
              minimumZoomScale={1}
            >
              <Image
                source={{ uri: localUri }}
                style={styles.image}
                resizeMode="contain"
              />
            </ScrollView>
          )}

          {!loading && !error && !isImage && (localUri || htmlFileUri) && (
            <WebView
              source={htmlFileUri ? { uri: htmlFileUri } : { uri: localUri! }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={(e) => {
                console.error('[DocumentViewer] WebView error:', e.nativeEvent);
                setError(t('cloud.modals.pdfViewer.webviewError'));
                setLoading(false);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={false}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              originWhitelist={['*']}
              mixedContentMode="always"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06071D' },
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
  closeButton: { padding: 4 },
  fileName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  placeholder: { width: 36 },
  content: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06071D',
  },
  loadingText: { color: '#9ca3af', fontSize: 14, marginTop: 12 },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  imageScroll: { flex: 1, backgroundColor: '#06071D' },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  image: { width: '100%', height: undefined, aspectRatio: 1 },
  webview: { flex: 1, backgroundColor: '#06071D' },
});
