import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type UserAvatarProps = {
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  size?: number;
  testID?: string;
};

export default function UserAvatar({
  firstName,
  lastName,
  photoUrl,
  size = 40,
  testID,
}: UserAvatarProps) {
  const initials = useMemo(() => {
    const firstInitial = firstName?.trim()?.[0]?.toUpperCase() || '';
    const lastInitial = lastName?.trim()?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || '?';
  }, [firstName, lastName]);

  const borderRadius = size / 2;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          testID={testID ? `${testID}-image` : undefined}
          source={{ uri: photoUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text
          testID={testID ? `${testID}-initials` : undefined}
          style={[
            styles.initials,
            {
              fontSize: Math.max(14, Math.round(size * 0.32)),
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
