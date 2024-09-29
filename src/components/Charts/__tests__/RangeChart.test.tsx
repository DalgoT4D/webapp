import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RangeChart, CharacterData } from '../RangeChart';
import * as d3 from 'd3';

describe('RangeChart', () => {
  const data: CharacterData[] = [
    { name: 'Character 1', percentage: '10', count: 100 },
    { name: 'Character 2', percentage: '20', count: 200 },
    { name: 'Character 3', percentage: '30', count: 300 },
    { name: 'Character 4', percentage: '40', count: 400 },
    { name: 'Character 5', percentage: '50', count: 500 },
    { name: 'Character 6', percentage: '60', count: 600 },
  ];

  it('renders without crashing', () => {
    render(<RangeChart data={data} />);
    const container = screen.getByTestId('range-chart-container');
    expect(container).toBeInTheDocument();
  });

  it('renders correct number of bars', () => {
    render(<RangeChart data={data} />);
    const container = screen.getByTestId('range-chart-container');
    const bars = d3.select(container).selectAll('rect').nodes();
    expect(bars.length).toBe(data.length * 2); // Considering both the main bars and the legend bars
  });

  it('trims long labels and shows tooltip on hover', async () => {
    render(<RangeChart data={data} />);
    const container = screen.getByTestId('range-chart-container');
    const legendTexts = d3.select(container).selectAll('g text').nodes();

    data.forEach((d, i) => {
      const originalLabel = d.name;
      const expectedLabel =
        originalLabel.length > 10
          ? `${originalLabel.substring(0, 10)}...`
          : originalLabel;
      const actualText = d3.select(legendTexts[i]).text();
      expect(actualText).toBe(expectedLabel);
    });

    const longLabelNode = legendTexts.find((node) =>
      d3.select(node).text().endsWith('...')
    );
    if (longLabelNode) {
      fireEvent.mouseOver(longLabelNode as HTMLElement);
      const tooltip = d3.select('body').select('.tooltip');

      await waitFor(() => {
        expect(tooltip.style('opacity')).toBe('0.9');
      });
    }
  });
});
