import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DateTimeInsights } from '../DateTimeInsights';
import { SessionProvider } from 'next-auth/react';
import { httpGet, httpPost } from '@/helpers/http';

const { barProps, type, minDate, maxDate, postBody } = {
  barProps:{data: [{ label: 'test_label1', value: 10, barTopLabel: 'top10' }]},
  type: 'chart',
  minDate: '2024-07-10T00:00:00Z',
  maxDate: '2024-08-10T00:00:00Z',
  postBody: {
    db_schema: 'test_db_schema1',
    db_table: 'test_db_table1',
    column_name: 'test_column1',
    filter: { range: 'year', limit: 10, offset: 2 },
  },
};
const mockSession = {
    expires : "1",
    user: {email: "a", name: "Delta", image: "c"}
}

jest.mock('next-auth/react');
// jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('@/helpers/http', () => ({
  httpGet: jest.fn(),
  httpPost: jest.fn(),
}));
jest.mock('@/utils/common', () => ({
  delay: jest.fn(() => Promise.resolve()),
}));
describe('DateTimeInsights', () => {
  beforeEach(() => {
    render(
      <SessionProvider session={mockSession}>
        <DateTimeInsights
          barProps={barProps}
          minDate={minDate}
          maxDate={maxDate}
          type={type}
          postBody={postBody}
        />
      </SessionProvider>
    );
  });

  it('renders the DateTimeInsights correctly', () => {
    const element = screen.getByRole('outerbox');
    expect(element).toBeInTheDocument();
    expect(screen.getByText('year')).toBeInTheDocument();
  });

});
