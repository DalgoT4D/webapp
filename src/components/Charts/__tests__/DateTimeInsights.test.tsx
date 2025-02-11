import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DateTimeInsights } from '../DateTimeInsights';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost } from '@/helpers/http';

// Mock the dependencies
jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock data
const mockBarProps = {
  data: [
    { year: 2023, frequency: 100 },
    { year: 2022, frequency: 200 },
  ],
};

const mockSession = {
  data: {
    user: { name: 'Test User' },
  },
};

describe('DateTimeInsights', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (httpPost as jest.Mock).mockResolvedValue({ task_id: 'test-task-id' });
    (httpGet as jest.Mock).mockResolvedValue({
      progress: [{ status: 'completed', results: { charts: [{ data: mockBarProps.data }] } }],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders chart view correctly', () => {
    render(
      <DateTimeInsights
        minDate="2022-01-01"
        maxDate="2023-01-01"
        barProps={mockBarProps}
        type="chart"
        postBody={{}}
      />
    );

    expect(screen.getByRole('outerbox')).toBeInTheDocument();
    expect(screen.getByText('year')).toBeInTheDocument();
  });

  it('renders numbers view correctly', () => {
    render(
      <DateTimeInsights
        minDate="2022-01-01"
        maxDate="2023-01-01"
        barProps={mockBarProps}
        type="numbers"
        postBody={{}}
      />
    );

    expect(screen.getByText('Minimum date')).toBeInTheDocument();
    expect(screen.getByText('Maximum date')).toBeInTheDocument();
    expect(screen.getByText('Total days data')).toBeInTheDocument();
  });

  it('switches between chart and numbers view', async () => {
    render(
      <DateTimeInsights
        minDate="2022-01-01"
        maxDate="2023-01-01"
        barProps={mockBarProps}
        type="chart"
        postBody={{}}
      />
    );

    const switchButtons = screen.getAllByAltText('switch icon');
    const viewSwitchButton = switchButtons[switchButtons.length - 1]; // Get the last switch icon

    await act(async () => {
      fireEvent.click(viewSwitchButton);
    });

    expect(screen.getByText('Minimum date')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(viewSwitchButton);
    });

    expect(screen.getByText('year')).toBeInTheDocument();
  });

  it('handles range update correctly', async () => {
    render(
      <DateTimeInsights
        minDate="2022-01-01"
        maxDate="2023-01-01"
        barProps={mockBarProps}
        type="chart"
        postBody={{}}
      />
    );

    const rangeSwitch = screen.getAllByAltText('switch icon')[0];
    await act(async () => {
      fireEvent.click(rangeSwitch);
    });

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(
        mockSession.data,
        'warehouse/insights/metrics/',
        expect.objectContaining({
          filter: expect.objectContaining({
            range: 'month',
          }),
        })
      );
    });
  });

  it('handles pagination correctly', async () => {
    (httpGet as jest.Mock).mockResolvedValue({
      progress: [
        {
          status: 'completed',
          results: { charts: [{ data: Array(10).fill({ year: 2023, frequency: 100 }) }] },
        },
      ],
    });

    render(
      <DateTimeInsights
        minDate="2022-01-01"
        maxDate="2023-01-01"
        barProps={{ data: Array(10).fill({ year: 2023, frequency: 100 }) }}
        type="chart"
        postBody={{}}
      />
    );

    const rightArrow = screen.getByTestId('ArrowRightIcon').parentElement;
    await act(async () => {
      fireEvent.click(rightArrow!);
    });

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(
        mockSession.data,
        'warehouse/insights/metrics/',
        expect.objectContaining({
          filter: expect.objectContaining({
            offset: 10,
          }),
        })
      );
    });
  });
});
