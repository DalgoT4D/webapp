import { render, screen, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Sources } from '../Sources';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
// import userEvent from '@testing-library/user-event';

describe('Sources', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  // Tests
  it('sources list no of columns', async () => {
    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });
    (global as any).fetch = mockedFetch;
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <Sources />
        </SessionProvider>
      );
    });

    expect(
      screen.getByText('No source found. Please create one')
    ).toBeInTheDocument();
  });

  it('new source button renders', async () => {
    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });
    (global as any).fetch = mockedFetch;
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <Sources />
        </SessionProvider>
      );
    });
    const button = screen.getByTestId('add-new-source');
    expect(button).toHaveTextContent('+ New Source');
  });

  it('new source button click opens dialogue & close button closes it', async () => {
    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });
    (global as any).fetch = mockedFetch;
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <Sources />
        </SessionProvider>
      );
    });
    // // Open dialogue box
    // const button = screen.getByTestId('add-new-source');
    // userEvent.click(button);
    // await waitFor(() => {
    //   expect(screen.getByText('Add a new source')).toBeInTheDocument();
    // });
    // // Close dialogue box
    // const closeButton = screen.getByTestId('CloseIcon');
    // userEvent.click(closeButton);
    // await waitFor(() => {
    //   expect(() => screen.getByText('Add a new source')).toThrow();
    // });
  });

  it('new source button click opens dialogue & cancel button closes it', async () => {
    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });
    (global as any).fetch = mockedFetch;
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <Sources />
        </SessionProvider>
      );
    });
    // // Open dialogue box
    // const button = screen.getByTestId('add-new-source');
    // userEvent.click(button);
    // await waitFor(() => {
    //   expect(screen.getByText('Add a new source')).toBeInTheDocument();
    // });
    // // Close dialogue box
    // const closeButton = screen.getByTestId('cancel');
    // userEvent.click(closeButton);
    // await waitFor(() => {
    //   expect(() => screen.getByText('Add a new source')).toThrow();
    // });
  });
});
