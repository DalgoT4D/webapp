import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BarChart, BarChartProps } from '../BarChart';
import * as d3 from 'd3';

describe('BarChart', () => {
  const data: BarChartProps['data'] = [
    { label: 'January', value: 30 },
    { label: 'February', value: 10 },
    { label: 'March', value: 50, barTopLabel: 'High' },
    { label: 'April', value: 20 },
    { label: 'May', value: 60 },
  ];

  it('renders the bar-chart correctly', () => {
    render(<BarChart data={data} />);
    const svgElement = screen.getByTestId('barchart-svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('renders correct number of bars', () => {
    render(<BarChart data={data} />);
    const svgElement = screen.getByTestId('barchart-svg');
    const bars = d3.select(svgElement).selectAll('.bar');
    expect(bars.size()).toBe(data.length);
  });

  it('renders correct values on bars', () => {
    render(<BarChart data={data} />);
    const svgElement = screen.getByTestId('barchart-svg');
    const barLabels = d3.select(svgElement).selectAll('g text').nodes();

    data.forEach((d, i) => {
      const expectedText = d.barTopLabel ? d.barTopLabel : d.value.toString();
      const actualText = d3.select(barLabels[i + data.length]).text();
      expect(actualText).toBe(expectedText);
    });
  });

  it('trims long labels and shows tooltip on hover', async () => {
    render(<BarChart data={data} />);
    const svgElement = screen.getByTestId('barchart-svg');
    const ticks = d3.select(svgElement).selectAll('.tick text').nodes();

    //trim label
    ticks.forEach((node, i) => {
      const originalLabel = data[i].label;
      const expectedLabel =
        originalLabel.length > 10 ? `${originalLabel.substring(0, 10)}...` : originalLabel;
      expect(d3.select(node).text()).toBe(expectedLabel);
    });

    const longLabelNode = ticks.find((node) => d3.select(node).text().endsWith('...'));
    if (longLabelNode) {
      fireEvent.mouseOver(longLabelNode as HTMLElement);
      const tooltip = d3.select('body').select('.tooltip');
      expect(tooltip.style('opacity')).toBe('0.9');
    }
  });
});
