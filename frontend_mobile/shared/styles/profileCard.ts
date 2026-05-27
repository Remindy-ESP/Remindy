import { StyleSheet } from 'react-native';

export const profileCardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    color: '#D3D6E8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
