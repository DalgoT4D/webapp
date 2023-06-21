import { render, screen, waitFor } from '@testing-library/react';
import { DBTTarget, DbtBlock } from '../DBTTarget';
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';
import userEvent from '@testing-library/user-event';

describe('tests for dbt-target component', () => {
  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it('checks for dbt action button', async () => {
    const mockSession: Session = {
      user: { email: 'a' },
    };

    const blocks: DbtBlock[] = [
      {
        blockName: 'run',
        action: 'run',
      } as DbtBlock,
    ];

    const setRunningMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <DBTTarget
          setDbtRunLogs={jest.fn()}
          setRunning={setRunningMock}
          setExpandLogs={jest.fn()}
          blocks={blocks}
        />
      </SessionProvider>
    );

    const title = screen.getByTestId('runJob');
    userEvent.click(title);
    await waitFor(() => {
      expect(setRunningMock).toBeCalled();
    });
  });
});
