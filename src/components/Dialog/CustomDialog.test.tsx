import { render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CustomDialog from './CustomDialog';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// const user = userEvent.setup();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Connections Setup', () => {

  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  it('renders the form', () => {

    render(
      <SessionProvider session={mockSession}>
        <CustomDialog
          formContent="formcontent"
          formActions="formactions"
          title="formtitle"
          show={true}
          handleClose={() => { }}
          handleSubmit={() => { }}
        />
      </SessionProvider>
    );

  });

  it('closes the form', async () => {

    const handleClose = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <CustomDialog
          formContent="formcontent"
          formActions="formactions"
          title="formtitle"
          show={true}
          handleClose={handleClose}
          handleSubmit={() => { }}
          loading={true}
        />
      </SessionProvider>
    );

    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalled();

  });

  it('shows the loading indicator', async () => {

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
      ])
    });

    const handleClose = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <CustomDialog
          formContent="formcontent"
          formActions="formactions"
          title="formtitle"
          show={true}
          handleClose={handleClose}
          handleSubmit={() => { }}
          loading={true}
        />
      </SessionProvider>
    );

    const circularprogress = screen.getByTestId('circularprogress');
    expect(circularprogress).toBeInTheDocument();

  });

  it('does not show the loading indicator', async () => {

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
      ])
    });

    const handleClose = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <CustomDialog
          formContent="formcontent"
          formActions="formactions"
          title="formtitle"
          show={true}
          handleClose={handleClose}
          handleSubmit={() => { }}
          loading={false}
        />
      </SessionProvider>
    );

    const circularprogress = screen.queryByTestId('circularprogress');
    expect(circularprogress).not.toBeInTheDocument();

  });


});