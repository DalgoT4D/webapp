import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTimeInsights } from '../DateTimeInsights';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: { user: { name: 'Test User' } } }),
}));

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
      <DateTimeInsights
        minDate="2021-01-01"
        maxDate="2022-01-01"
        barProps={mockBarProps}
        type="chart"
        postBody={mockPostBody}
      />
    );

    expect(screen.getByRole('outerbox')).toBeInTheDocument();
  });
});
