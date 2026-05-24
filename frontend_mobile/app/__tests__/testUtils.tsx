import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function AppStatusScreenMock({ code, title, message, actions }: any) {
  return (
    <View>
      <Text>{code}</Text>
      <Text>{title}</Text>
      <Text>{message}</Text>
      {actions.map((action: any) => (
        <TouchableOpacity key={action.label} testID={action.testID} onPress={action.onPress}>
          <Text>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
