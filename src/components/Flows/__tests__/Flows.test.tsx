import { render, screen, act, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Flows, FlowInterface } from '../Flows';
import { FlowRun } from '../SingleFlowRunHistory';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GlobalContext } from '@/contexts/ContextProvider';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Flow Creation', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  // ================================================================================
  it('renders the form', async () => {
    const updateCrudValMock = jest.fn();

    const startTime = new Date(new Date().valueOf() - 15 * 24 * 3600 * 1000);

    await act(async () => {
      render(
        <GlobalContext.Provider
          value={{
            Permissions: {
              state: [
                'can_view_pipeline',
                'can_run_pipeline',
                'can_edit_pipeline',
                'can_delete_pipeline',
                'can_create_pipeline',
              ],
            },
          }}
        >
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'flow-0',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'deployment-id-0',
                  lastRun: {
                    name: 'flow-run-0',
                    status: 'COMPLETED',
                    startTime: startTime.toString(),
                    expectedStartTime: startTime.toString(),
                  } as FlowRun,
                } as FlowInterface,
                {
                  name: 'flow-1',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'deployment-id-1',
                  lastRun: {
                    name: 'flow-run-1',
                    status: 'FAILED',
                    startTime: startTime.toString(),
                    expectedStartTime: startTime.toString(),
                  } as FlowRun,
                } as FlowInterface,
                {
                  name: 'flow-2',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'deployment-id-2',
                  lastRun: null,
                  lock: null,
                } as FlowInterface,
              ]}
              updateCrudVal={updateCrudValMock}
              mutate={() => {}}
              setSelectedFlowId={() => {}}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    const flowstate0 = screen.getByTestId('flowstate-flow-0');
    expect(flowstate0).toBeInTheDocument();
    const { getByText: getByTextFlowState_0 } = within(flowstate0);
    expect(getByTextFlowState_0('success')).toBeInTheDocument();

    const flowstate1 = screen.getByTestId('flowstate-flow-1');
    expect(flowstate1).toBeInTheDocument();
    const { getByText: getByTextFlowState_1 } = within(flowstate1);
    expect(getByTextFlowState_1('failed')).toBeInTheDocument();

    const flowlastrun0 = screen.getByTestId('flowlastrun-flow-0');
    expect(flowlastrun0).toBeInTheDocument();
    const { getByText: getByTextFlowRun_0 } = within(flowlastrun0);
    expect(getByTextFlowRun_0('15 days ago')).toBeInTheDocument();

    const flowstate2 = screen.getByTestId('flowstate-flow-2');
    expect(flowstate2).toBeInTheDocument();
    const { getByText: getByTextFlowRun_2 } = within(flowstate2);
    expect(getByTextFlowRun_2('—')).toBeInTheDocument();

    // open history
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          id: '',
          name: 'flow-run-0',
          status: 'COMPLETED',
          runs: [],
          startTime: startTime.toString(),
          expectedStartTime: startTime.toString(),
        } as any,
      ]),
    });

    const fetchLastFlowRunButton = screen.getByTestId('btn-openhistory-flow-0');
    await userEvent.click(fetchLastFlowRunButton);
    const flowRunInfo = screen.getByTestId('flowlogs-dialog');
    expect(flowRunInfo).toBeInTheDocument();

    // quick run deployment
    const postFlowRunMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([{}]),
    });
    (global as any).fetch = postFlowRunMock;
    const openQuickRunDeploymentButton = screen.getByTestId(
      'btn-quickrundeployment-flow-0'
    );
    await userEvent.click(openQuickRunDeploymentButton);
    expect(postFlowRunMock).toHaveBeenCalled();

    // delete flow
  });
});
