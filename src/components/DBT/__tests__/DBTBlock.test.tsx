import { render, screen } from '@testing-library/react';
import { DBTBlock } from '../DBTBlock'
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';
import userEvent from '@testing-library/user-event';

describe("tests for dbt-block component", () => {

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it("checks for dbt action button", () => {

    const mockSession: Session = {
      user: { email: 'a' },
    };

    render(
      <SessionProvider session={mockSession}>
        <DBTBlock blockName="dbt-block-name" action="dbt-block-action" />
      </SessionProvider>
    );

    const actionButton = screen.getByTestId('dbtactionbutton-dbt-block-action');

    expect(actionButton).toHaveTextContent('dbt dbt-block-action');

  });

  it("checks for logs when a job succeeds", async () => {

    const mockSession: Session = {
      user: { email: 'a' },
    };

    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(
        {
          status: 'success',
          result: [
            'logmessage-0',
            'logmessage-1',
          ]
        }
      )
    });
    (global as any).fetch = mockedFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTBlock blockName="dbt-block-name" action="dbt-block-action" />
      </SessionProvider>
    );

    const actionButton = screen.getByTestId('dbtactionbutton-dbt-block-action');
    await userEvent.click(actionButton);

    const logline0 = screen.getByTestId('logline-0');
    expect(logline0).toHaveTextContent('logmessage-0');

    const logline1 = screen.getByTestId('logline-1');
    expect(logline1).toHaveTextContent('logmessage-1');
  });

  it("checks for logs when a job fails", async () => {

    const mockSession: Session = {
      user: { email: 'a' },
    };

    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(
        {
          status: 'failed',
          result: [
            'logmessage-0',
            'logmessage-1',
          ]
        }
      )
    });
    (global as any).fetch = mockedFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTBlock blockName="dbt-block-name" action="dbt-block-action" />
      </SessionProvider>
    );

    const actionButton = screen.getByTestId('dbtactionbutton-dbt-block-action');
    await userEvent.click(actionButton);

    const logline0 = screen.getByTestId('logline-0');
    expect(logline0).toHaveTextContent('logmessage-0');

    const logline1 = screen.getByTestId('logline-1');
    expect(logline1).toHaveTextContent('logmessage-1');
  });

});