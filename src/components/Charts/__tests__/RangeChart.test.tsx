import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RangeChart, { CharacterData } from '../RangeChart';
import userEvent from '@testing-library/user-event';

const mockData: CharacterData[] = [
  { name: 'Character 1', percentage: '10', count: 100 },
  { name: 'Character 2', percentage: '20', count: 200 },
  { name: 'Character 3', percentage: '30', count: 300 },
  { name: 'Character 4', percentage: '40', count: 400 },
];

describe('RangeChart', () => {
  test('renders the chart container', () => {
    render(<RangeChart data={mockData} />);
    const container = screen.getByTestId('range-chart-container');
    expect(container).toBeInTheDocument();
  });

  test('checks correctly renders tooltip on mouseover and out', async () => {
    render(<RangeChart data={mockData} />);
    const bars = screen
      .getByTestId('range-chart-container')
      .querySelectorAll('rect');

    const tooltip = document.querySelector('.tooltip');
    expect(tooltip).toHaveStyle('opacity: 0');
    fireEvent.mouseOver(bars[0]);
    await waitFor(
      () => {
        expect(tooltip).toHaveStyle('opacity: 0.9');
      },
      { timeout: 210 }
    );
    fireEvent.mouseLeave(bars[0]);
    await waitFor(
      () => {
        expect(tooltip).toHaveStyle('opacity: 0');
      },
      { timeout: 210 }
    );
  });
});

