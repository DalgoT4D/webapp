import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StatsChart } from '../StatsChart';

describe('StatsChart', () => {
  const data = {
    minimum: 10,
    maximum: 90,
    mean: 50,
    median: 45,
    mode: 40,
    otherModes: [35, 60],
  };

  beforeEach(() => {
    render(<StatsChart data={data} />);
  });
  it('renders svg statcharts correctly', () => {
    const svg = screen.getByTestId('svg-container');
    expect(svg).toBeInTheDocument();

    expect(screen.getByText('Min: 10')).toBeInTheDocument();
    expect(screen.getByText('Max: 90')).toBeInTheDocument();
    expect(screen.getByText('Mean: 50')).toBeInTheDocument();
    expect(screen.getByText('Median: 45')).toBeInTheDocument();
    expect(screen.getByText('Mode: 40')).toBeInTheDocument();
  });

  it('checks if mouseover works correctly', async () => {
    const modeLabel = screen.getByText('Mode: 40');
    fireEvent.mouseOver(modeLabel);

    const tooltip = screen.getByText('Other modes: 35, 60');
    expect(tooltip).toBeInTheDocument();
    await waitFor(() => {
      expect(tooltip).toHaveStyle('opacity: 0.9');
    });
    fireEvent.mouseLeave(modeLabel);
    await waitFor(() => {
      expect(tooltip).toHaveStyle('opacity: 0');
    });
  });
});
