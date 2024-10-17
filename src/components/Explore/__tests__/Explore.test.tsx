import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Explore } from '../Explore';
import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const mockSession: Session = {
  expires: 'false',
  user: { email: 'a' },
};

const mockedFetch = jest.fn().mockResolvedValueOnce({
  ok: true,
  json: jest.fn().mockResolvedValueOnce([]),
});
(global as any).fetch = mockedFetch;

it('renders the explore page with preview and data statistics tab', async () => {
  render(
    <SessionProvider session={mockSession}>
      <Explore />
    </SessionProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Data statistics')).toBeInTheDocument();
  });
});
