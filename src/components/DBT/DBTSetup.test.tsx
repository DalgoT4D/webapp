import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { DBTSetup } from './DBTSetup';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

beforeEach(() => {
  const fakeResponse = {};
  const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
  const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
  (global as any).fetch = mockedFetch;
});

afterEach(() => {
  const fakeResponse = {};
  const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
  const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
  (global as any).fetch = mockedFetch;
});

describe('dbt Setup', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  it('renders the form', () => {
    render(
      <SessionProvider session={mockSession}>
        <DBTSetup />
      </SessionProvider>
    );
    const inputfield = screen.getByTestId('github-url');
    expect(inputfield).toBeInTheDocument();
    const button = screen.getByTestId('save-github-url');
    expect(button).toHaveTextContent(
      'Save'
    );
  });

});
