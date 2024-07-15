import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { StringInsights } from '../StringInsights';


jest.mock('../RangeChart', () => jest.fn(() => <div>RangeChart</div>));
jest.mock('../BarChart', () => ({
  BarChart: jest.fn(() => <div>BarChart</div>),
}));
jest.mock('../StatsChart', () => ({
  StatsChart: jest.fn(() => <div>StatsChart</div>),
}));


const mockData = [
  { name: 'Character 1', count: 10, percentage: 50 },
  { name: 'Character 2', count: 20, percentage: 50 },
];

const mockStatsData = {
  minimum: 1,
  maximum: 20,
  mean: 10,
  median: 10,
  mode: 10,
  range: 19,
};

describe('StringInsights', () => {
  it('should render the RangeChart by default', () => {
    render(<StringInsights data={mockData} statsData={mockStatsData} />);
    expect(screen.getByText('RangeChart')).toBeInTheDocument();
  });

  it('should switch to BarChart on switch icon click', () => {
    render(<StringInsights data={mockData} statsData={mockStatsData} />);
    const switchIconElement = screen.getByAltText('switch icon');
    fireEvent.click(switchIconElement);
    expect(screen.getByText('BarChart')).toBeInTheDocument();
  });

  it('should switch to StatsChart on second switch icon click', () => {
    render(<StringInsights data={mockData} statsData={mockStatsData} />);
    const switchIconElement = screen.getByAltText('switch icon');
    fireEvent.click(switchIconElement); // switch to BarChart
    fireEvent.click(switchIconElement); // switch to StatsChart
    expect(screen.getByText('StatsChart')).toBeInTheDocument();
    expect(screen.getByText('String length distribution')).toBeInTheDocument();
  });

  it('should switch back to RangeChart on third switch icon click', () => {
    render(<StringInsights data={mockData} statsData={mockStatsData} />);
    const switchIconElement = screen.getByAltText('switch icon');
    fireEvent.click(switchIconElement); // switch to BarChart
    fireEvent.click(switchIconElement); // switch to StatsChart
    fireEvent.click(switchIconElement); // switch to RangeChart
    expect(screen.getByText('RangeChart')).toBeInTheDocument();
  });

  it('should display message when all entries are identical in length in StatsChart', () => {
    const identicalStatsData = {
      minimum: 10,
      maximum: 10,
      mean: 10,
      median: 10,
      mode: 10,
      range: 0,
    };
    render(<StringInsights data={mockData} statsData={identicalStatsData} />);
    const switchIconElement = screen.getByAltText('switch icon');
    fireEvent.click(switchIconElement); // switch to BarChart
    fireEvent.click(switchIconElement); // switch to StatsChart
    expect(
      screen.getByText('All entries in this column are identical in length')
    ).toBeInTheDocument();
  });
});
