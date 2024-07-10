import * as d3 from 'd3';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BarChart } from '../BarChart';

const mockData = [
  {
    label: 'test1',
    value: 40,
    barTopLabel: 'top 40',
  },
  {
    label: 'test2',
    value: 70,
    barTopLabel: 'top70',
  },
];

describe('BarChart', () => {
  beforeEach(() => {
    render(<BarChart data={mockData} />);
  });

  it('should render the svg element', () => {
    const svgElement = screen.getByTestId('barchart-svg');
    expect(svgElement).toBeInTheDocument();
  });


  // it('shows tooltip on label hover', () => {
  //   mockData.forEach(async (data) => {
  //     const label = screen.getByText(data.label);
  //     fireEvent.mouseOver(label);
  //     const tooltip = screen.getByText(data.label);
  //     expect(tooltip).toBeInTheDocument();
  //     await waitFor(() => {
  //       const tooltip = screen.getByText(data.label);
  //       expect(tooltip).toBeInTheDocument();
  //       expect(tooltip).toHaveStyle('opacity: 0.9445');
  //     });

      // fireEvent.mouseLeave(label);

      // await waitFor(() => {
      //   const tooltip = screen.getByText(data.label);
      //   expect(tooltip).toHaveStyle('opacity: 0');
      // });
      //   fireEvent.mouseLeave(label);
      //   expect(tooltip).not.toBeInTheDocument();
    });

