import { fireEvent, screen } from '@testing-library/react';

export const fireMultipleKeyDown = async (testId: string, times: number) => {
  const element = screen.getByTestId(testId);
  for (let i = 0; i < times; i++) {
    await fireEvent.keyDown(element, { key: 'ArrowDown' });
  }
  await fireEvent.keyDown(element, { key: 'Enter' });
};
