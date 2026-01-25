import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppResetProvider, useAppReset } from '../AppResetContext';

function TestComponent() {
  const { resetToken, triggerReset } = useAppReset();
  return (
    <View>
      <Text testID="token">{String(resetToken)}</Text>
      <Pressable onPress={triggerReset} testID="resetBtn">
        <Text>Reset</Text>
      </Pressable>
    </View>
  );
}

describe('AppResetContext', () => {
  it('provides initial resetToken of 0', () => {
    const { getByTestId } = render(
      <AppResetProvider>
        <TestComponent />
      </AppResetProvider>
    );

    expect(getByTestId('token').children[0]).toBe('0');
  });

  it('increments resetToken when triggerReset is called', () => {
    const { getByTestId } = render(
      <AppResetProvider>
        <TestComponent />
      </AppResetProvider>
    );

    expect(getByTestId('token').children[0]).toBe('0');

    fireEvent.press(getByTestId('resetBtn'));
    expect(getByTestId('token').children[0]).toBe('1');

    fireEvent.press(getByTestId('resetBtn'));
    expect(getByTestId('token').children[0]).toBe('2');
  });

  it('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAppReset must be used within an AppResetProvider'
    );

    consoleError.mockRestore();
  });
});
