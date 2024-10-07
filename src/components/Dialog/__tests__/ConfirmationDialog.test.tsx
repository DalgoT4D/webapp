import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import ConfirmationDialog from '../ConfirmationDialog';
import userEvent from '@testing-library/user-event';
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
    user: { email: 'a' },
  };

  it('checks for confirm and cancel buttons', () => {
    render(
      <SessionProvider session={mockSession}>
        <ConfirmationDialog
          show={true}
          message="confirmation-message"
          handleClose={() => {}}
          handleConfirm={() => {}}
          loading={false}
        />
      </SessionProvider>
    );
    const confirmbutton = screen.getByTestId('confirmbutton');
    expect(confirmbutton).toBeInTheDocument();
    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();
  });

  it('checks for loading indicator', () => {
    render(
      <SessionProvider session={mockSession}>
        <ConfirmationDialog
          show={true}
          message="confirmation-message"
          handleClose={() => {}}
          handleConfirm={() => {}}
          loading={true}
        />
      </SessionProvider>
    );
    const circularprogress = screen.getByTestId('circularprogress');
    expect(circularprogress).toBeInTheDocument();
  });

  it('checks for close icon function', async () => {
    const handleCloseMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <ConfirmationDialog
          show={true}
          message="confirmation-message"
          handleClose={() => handleCloseMock()}
          handleConfirm={() => {}}
          loading={false}
        />
      </SessionProvider>
    );
    const closeicon = screen.getByTestId('closeicon');
    await userEvent.click(closeicon);
    expect(handleCloseMock).toHaveBeenCalled();
  });

  it('checks for cancel button function', async () => {
    const handleCloseMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <ConfirmationDialog
          show={true}
          message="confirmation-message"
          handleClose={() => handleCloseMock()}
          handleConfirm={() => {}}
          loading={false}
        />
      </SessionProvider>
    );
    const cancelbutton = screen.getByTestId('cancelbutton');
    await userEvent.click(cancelbutton);
    expect(handleCloseMock).toHaveBeenCalled();
  });

  it('checks for confirm button function', async () => {
    const handleConfirmMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <ConfirmationDialog
          show={true}
          message="confirmation-message"
          handleClose={() => {}}
          handleConfirm={() => handleConfirmMock()}
          loading={false}
        />
      </SessionProvider>
    );
    const confirmbutton = screen.getByTestId('confirmbutton');
    await userEvent.click(confirmbutton);
    expect(handleConfirmMock).toHaveBeenCalled();
  });

  it('checks for the message text', () => {
    render(
      <SessionProvider session={mockSession}>
        <ConfirmationDialog
          show={true}
          message="confirmation-message"
          handleClose={() => {}}
          handleConfirm={() => {}}
          loading={false}
        />
      </SessionProvider>
    );
    const messageholder = screen.getByTestId('messageholder');
    expect(messageholder.textContent).toMatch('confirmation-message');
  });
});
