import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Connections } from './Connections';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// const user = userEvent.setup();

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

describe('Connections Setup', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  it('renders the form', () => {
    render(
      <SessionProvider session={mockSession}>
        <Connections />
      </SessionProvider>
    );
    const addNewConnectionButton = screen.getByTestId('add-new-connection');
    expect(addNewConnectionButton).toBeInTheDocument();

  });

});