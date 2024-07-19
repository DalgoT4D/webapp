import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NumberInsights } from '../NumberInsights';

const mockData = [
  {
    minimum: 10,
    maximum: 90,
    mean: 50,
    median: 45,
    mode: 40,
    otherModes: [35, 60],
  },
  {
    minimum: 30,
    maximum: 30,
    mean: 50,
    median: 45,
    mode: 40,
    otherModes: [35, 60],
  },
];

describe('NumberInsights', () => {
  it('checks the switch button when type is chart and max & min is NOT identical', async () => {
    render(<NumberInsights data={mockData[0]} type="chart" />);

    const imgSwitchIcon = screen.getByTestId('switchicon-numbers');
    expect(imgSwitchIcon).toBeInTheDocument();
    expect(screen.getByTestId('svg-container')).toBeInTheDocument();

    fireEvent.click(imgSwitchIcon);

    await waitFor(() => {
      expect(screen.getByTestId('innermostbox-0')).toBeInTheDocument();
    });
  });

  it('checks the switch button when type is chart and max & min is identical', async () => {
    render(<NumberInsights data={mockData[1]} type="chart" />);

    const imgSwitchIcon = screen.getByTestId('switchicon-numbers');
    expect(imgSwitchIcon).toBeInTheDocument();
    expect(
      screen.getByText('All entries in this column are identical')
    ).toBeInTheDocument();

    fireEvent.click(imgSwitchIcon);

    await waitFor(() => {
      expect(screen.getByTestId('innermostbox-0')).toBeInTheDocument();
    });
  });

  it('checks the switch button when type is numbers and max & min is identical', async () => {
    render(<NumberInsights data={mockData[1]} type="numbers" />);

    const imgSwitchIcon = screen.getByTestId('switchicon-chart');
    expect(imgSwitchIcon).toBeInTheDocument();
    expect(screen.getByTestId('innermostbox-0')).toBeInTheDocument();

    fireEvent.click(imgSwitchIcon);

    await waitFor(() => {
      expect(
        screen.getByText('All entries in this column are identical')
      ).toBeInTheDocument();
    });
  });

  it('checks the switch button when type is numbers and max & min is NOT identical', async () => {
    render(<NumberInsights data={mockData[0]} type="numbers" />);

    const imgSwitchIcon = screen.getByTestId('switchicon-chart');
    expect(imgSwitchIcon).toBeInTheDocument();
    expect(screen.getByTestId('innermostbox-0')).toBeInTheDocument();

    fireEvent.click(imgSwitchIcon);

    await waitFor(() => {
      expect(screen.getByTestId('svg-container')).toBeInTheDocument();
    });
  });
});
