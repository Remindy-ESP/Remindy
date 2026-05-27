import type { TextStyle, ViewStyle } from 'react-native';

/** Shared styles for the red logout button used on profile & settings screens. */
export const logoutButtonStyles: {
  logoutButton: ViewStyle;
  logoutButtonDisabled: ViewStyle;
  logoutButtonText: TextStyle;
} = {
  logoutButton: {
    marginTop: 6,
    backgroundColor: '#D94A58',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#777B99',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
};
