import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateTimeInsights } from '../DateTimeInsights';
import { SessionProvider } from 'next-auth/react';


// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: { user: { name: 'Test User' } } }),
}));
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />);
// jest.mock('fetch');

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
      // <SessionProvider session={null}>
        <DateTimeInsights
          minDate="2021-01-01"
          maxDate="2022-01-01"
          barProps={mockBarProps}
          type="chart"
          postBody={mockPostBody}
        />
      // </SessionProvider>
    );

    expect(screen.getByRole('outerbox')).toBeInTheDocument();
    // expect(screen.getByText('year')).toBeInTheDocument();
    // expect(screen.getByAltText('switch icon')).toBeInTheDocument();
  });

});