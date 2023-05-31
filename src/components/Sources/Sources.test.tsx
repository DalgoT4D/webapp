import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Sources } from './Sources';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

describe('Sources', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  // Mock fetch to handle useEffect in components
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

  // Tests
  it('sources list no of columns', async () => {
    render(
      <SessionProvider session={mockSession}>
        <Sources />
      </SessionProvider>
    );
    const columns = screen.getAllByRole('columnheader');
    expect(columns.length).toBe(3);
  });

  it('new source button renders', async () => {
    render(
      <SessionProvider session={mockSession}>
        <Sources />
      </SessionProvider>
    );
    const button = screen.getByTestId('add-new-source');
    expect(button).toHaveTextContent('+ New Source');
  });

  it('new source button click opens dialogue & close button closes it', async () => {
    // render(
    //   <SessionProvider session={mockSession}>
    //     <Sources />
    //   </SessionProvider>
    // );
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
    // render(
    //   <SessionProvider session={mockSession}>
    //     <Sources />
    //   </SessionProvider>
    // );
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
