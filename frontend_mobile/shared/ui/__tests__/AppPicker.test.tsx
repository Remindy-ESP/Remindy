import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppPicker, { PickerItem } from '@/shared/ui/AppPicker';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const ITEMS: PickerItem[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
];

describe('AppPicker', () => {
  const onValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Renders the trigger button
  it('renders the trigger button', () => {
    const { getByText } = render(
      <AppPicker items={ITEMS} selectedValue="" onValueChange={onValueChange} placeholder="Pick one" />
    );
    expect(getByText('Pick one')).toBeTruthy();
  });

  // 2. Shows placeholder when no item matches selectedValue
  it('shows placeholder when selectedValue does not match any item', () => {
    const { getByText } = render(
      <AppPicker items={ITEMS} selectedValue="unknown" onValueChange={onValueChange} placeholder="Select a fruit" />
    );
    expect(getByText('Select a fruit')).toBeTruthy();
  });

  // 3. Shows selected item's label when selectedValue matches
  it('shows the selected item label when selectedValue matches an item', () => {
    const { getByText } = render(
      <AppPicker items={ITEMS} selectedValue="banana" onValueChange={onValueChange} placeholder="Pick one" />
    );
    expect(getByText('Banana')).toBeTruthy();
  });

  // 4. Opens modal when trigger is pressed
  it('opens the modal when the trigger button is pressed', () => {
    const { getByText, getAllByText } = render(
      <AppPicker items={ITEMS} selectedValue="" onValueChange={onValueChange} placeholder="Pick one" />
    );
    // Before pressing: modal items are not visible
    expect(() => getAllByText('Apple')).toThrow();

    fireEvent.press(getByText('Pick one'));

    expect(getByText('Apple')).toBeTruthy();
  });

  // 5. Renders all items in the modal
  it('renders all items in the modal after opening', () => {
    const { getByText } = render(
      <AppPicker items={ITEMS} selectedValue="" onValueChange={onValueChange} placeholder="Pick one" />
    );
    fireEvent.press(getByText('Pick one'));

    expect(getByText('Apple')).toBeTruthy();
    expect(getByText('Banana')).toBeTruthy();
    expect(getByText('Cherry')).toBeTruthy();
  });

  // 6. Calls onValueChange with the correct value when an item is pressed
  it('calls onValueChange with the correct value when an item is selected', () => {
    const { getByText } = render(
      <AppPicker items={ITEMS} selectedValue="" onValueChange={onValueChange} placeholder="Pick one" />
    );
    fireEvent.press(getByText('Pick one'));
    fireEvent.press(getByText('Cherry'));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('cherry');
  });

  // 7. Closes the modal after selecting an item
  it('closes the modal after an item is selected', () => {
    const { getByText, queryByText } = render(
      <AppPicker items={ITEMS} selectedValue="" onValueChange={onValueChange} placeholder="Pick one" />
    );
    fireEvent.press(getByText('Pick one'));
    expect(getByText('Apple')).toBeTruthy();

    fireEvent.press(getByText('Apple'));

    // After selection the modal items should no longer be visible
    expect(queryByText('Banana')).toBeNull();
    expect(queryByText('Cherry')).toBeNull();
  });

  // 8. Shows checkmark (selected style) on the currently selected item
  it('renders the selected item with a distinct text style inside the modal', () => {
    const { getByText, getAllByText } = render(
      <AppPicker items={ITEMS} selectedValue="banana" onValueChange={onValueChange} placeholder="Pick one" />
    );

    // Open the modal by pressing the trigger
    fireEvent.press(getByText('Banana'));

    // Now there are two "Banana" nodes: the trigger label and the modal item.
    // The modal item is the last one rendered.
    const bananaNodes = getAllByText('Banana');
    const modalItemLabel = bananaNodes[bananaNodes.length - 1];

    // The selected item text should have the itemTextSelected color (#818cf8)
    expect(modalItemLabel.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#818cf8' }),
      ])
    );
  });

  // 9. Renders empty list when items array is empty
  it('renders without crashing when items array is empty', () => {
    const { getByText, toJSON } = render(
      <AppPicker items={[]} selectedValue="" onValueChange={onValueChange} placeholder="No options" />
    );
    expect(toJSON()).toBeTruthy();
    expect(getByText('No options')).toBeTruthy();

    // Open modal — should not crash even with empty list
    fireEvent.press(getByText('No options'));
    expect(toJSON()).toBeTruthy();
  });

  // 10. Works when placeholder is undefined (shows empty string)
  it('shows empty string when placeholder is undefined and no item matches', () => {
    const { getByText } = render(
      <AppPicker items={ITEMS} selectedValue="nonexistent" onValueChange={onValueChange} />
    );
    // displayLabel falls back to '' — the Text node still renders, with empty content
    const triggerText = getByText('', { exact: true });
    expect(triggerText).toBeTruthy();
  });
});
