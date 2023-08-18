import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DBTTarget } from '../DBTTarget';

jest.mock('./../../../utils/common');

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

const dbtBlocks: any = [
  {
    blockName: 'block-1',
    blockId: 'block-id-1',
    blockType: 'dbt Core Operation',
    target: 'prod',
    action: 'clean',
    deploymentId: null,
  },
  {
    blockName: 'block-2',
    blockId: 'block-id-2',
    blockType: 'dbt Core Operation',
    target: 'prod',
    action: 'deps',
    deploymentId: null,
  },
  {
    blockName: 'block-3',
    blockId: 'block-id-3',
    blockType: 'dbt Core Operation',
    target: 'prod',
    action: 'run',
    deploymentId: 'deployment-id',
  },
  {
    blockName: 'block-4',
    blockId: 'block-id-4',
    blockType: 'dbt Core Operation',
    target: 'prod',
    action: 'test',
    deploymentId: null,
  },
];

const setDbtRunLogs = jest.fn();
const setRunning = jest.fn();
const setExpandLogs = jest.fn();

describe('Execute dbt jobs', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  it('render the execute button and commands drop down', async () => {
    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            blocks={dbtBlocks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(dbtBlocks.length + 1);
    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('DBT clean')).toBeInTheDocument();
    expect(screen.getByText('DBT deps')).toBeInTheDocument();
    expect(screen.getByText('DBT run')).toBeInTheDocument();
    expect(screen.getByText('DBT test')).toBeInTheDocument();

    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
  });
});
