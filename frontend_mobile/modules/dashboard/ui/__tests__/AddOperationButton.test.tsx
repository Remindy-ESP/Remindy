import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AddOperationButton from '../AddOperationButton';

describe('AddOperationButton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<AddOperationButton onPress={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });

  it('calls onPress callback when button is pressed', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<AddOperationButton onPress={onPress} />);

    // The root element is a TouchableOpacity
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when not pressed', () => {
    const onPress = jest.fn();
    render(<AddOperationButton onPress={onPress} />);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress each time the button is pressed (multiple presses)', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<AddOperationButton onPress={onPress} />);
    const { TouchableOpacity } = require('react-native');
    const button = UNSAFE_getByType(TouchableOpacity);

    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('renders both horizontal and vertical bars to form the plus icon', () => {
    const { UNSAFE_getAllByType } = render(<AddOperationButton onPress={jest.fn()} />);
    const { View } = require('react-native');
    // container + plusIcon + horizontalBar + verticalBar = 4 View elements
    const views = UNSAFE_getAllByType(View);
    expect(views.length).toBeGreaterThanOrEqual(4);
  });

  it('accepts different onPress functions and calls the correct one', () => {
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    const { UNSAFE_getByType, rerender } = render(
      <AddOperationButton onPress={firstHandler} />
    );
    const { TouchableOpacity } = require('react-native');

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(firstHandler).toHaveBeenCalledTimes(1);

    rerender(<AddOperationButton onPress={secondHandler} />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(firstHandler).toHaveBeenCalledTimes(1);
  });
});
