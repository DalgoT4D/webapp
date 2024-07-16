import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateTimeInsights } from '../DateTimeInsights';
import { SessionProvider } from 'next-auth/react';
import moment from 'moment';

// Mock dependencies
jest.mock('@/helpers/http', () => ({
  httpGet: jest.fn(),
  httpPost: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: { user: { name: 'Test User' } } }),
}));
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />);

const mockBarProps = {
  data: [
    { year: 2021, month: 1, day: 1, frequency: 10 },
    { year: 2022, month: 1, day: 1, frequency: 15 },
  ],
};

const mockPostBody = {};

describe('DateTimeInsights', () => {
  it('renders the component with chart type', () => {
    render(
      <SessionProvider session={null}>
        <DateTimeInsights
          minDate="2021-01-01"
          maxDate="2022-01-01"
          barProps={mockBarProps}
          type="chart"
          postBody={mockPostBody}
        />
      </SessionProvider>
    );

    expect(screen.getByRole('outerbox')).toBeInTheDocument();
    expect(screen.getByText('year')).toBeInTheDocument();
    expect(screen.getByAltText('switch icon')).toBeInTheDocument();
  });

  it('toggles to numbers view', () => {
    render(
      <SessionProvider session={null}>
        <DateTimeInsights
          minDate="2021-01-01"
          maxDate="2022-01-01"
          barProps={mockBarProps}
          type="chart"
          postBody={mockPostBody}
        />
      </SessionProvider>
    );

    fireEvent.click(screen.getByAltText('switch icon'));

    expect(screen.getByText('Minimum date')).toBeInTheDocument();
    expect(screen.getByText('Maximum date')).toBeInTheDocument();
  });

  it('updates offset when clicking right arrow', async () => {
    render(
      <SessionProvider session={null}>
        <DateTimeInsights
          minDate="2021-01-01"
          maxDate="2022-01-01"
          barProps={mockBarProps}
          type="chart"
          postBody={mockPostBody}
        />
      </SessionProvider>
    );

    const rightArrow = screen.getAllByRole('button')[1];
    fireEvent.click(rightArrow);

    await waitFor(() => {
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  it('updates range when clicking range switch icon', async () => {
    render(
      <SessionProvider session={null}>
        <DateTimeInsights
          minDate="2021-01-01"
          maxDate="2022-01-01"
          barProps={mockBarProps}
          type="chart"
          postBody={mockPostBody}
        />
      </SessionProvider>
    );

    const rangeSwitchIcon = screen.getAllByAltText('switch icon')[0];
    fireEvent.click(rangeSwitchIcon);

    await waitFor(() => {
      expect(screen.getByText('month')).toBeInTheDocument();
    });
  });

  it('displays no data message when data is unavailable', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

    render(
      <SessionProvider session={null}>
        <DateTimeInsights
          minDate="2021-01-01"
          maxDate="2022-01-01"
          barProps={{ data: [] }}
          type="chart"
          postBody={mockPostBody}
        />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No Data available')).toBeInTheDocument();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
