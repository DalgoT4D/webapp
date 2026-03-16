import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FlowEditor from '../FlowEditor';
import { GlobalContext } from '@/contexts/ContextProvider';
import { DbtRunLogsUpdateContext } from '@/contexts/DbtRunLogsContext';
import { CanvasActionContext } from '@/contexts/FlowEditorCanvasContext';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: {
      expires: 'true',
      user: { email: 'a' },
    },
  }),
}));

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('FlowEditor', () => {
  const mockGlobalContext = {
    Permissions: { state: [] },
    CurrentOrg: { state: { slug: 'mock-org-slug' } },
  };

  const mockDbtRunLogsContext = jest.fn();

  const mockFlowEditorCanvasContext = {
    canvasAction: { type: null },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  (global as any).fetch = jest.fn((url: string) => {
    switch (true) {
      case url.includes('transform/dbt_project/graph/'):
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ nodes: [], edges: [] }),
        });
      case url.includes('prefect/tasks/transform'):
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                label: 'DBT run',
                slug: 'dbt-run',
                id: 181,
                uuid: '63913f1d-13b2-43e9-8f4f-32a519825a4b',
                deploymentId: '3ff531a1-8d98-45cf-9de9-219852b28129',
                lock: null,
                command: 'dbt run',
                generated_by: 'system',
                seq: 4,
              },
            ]),
        });

      case url.includes('tasks/mock-org-slug?hashkey=syncsources-mock-org-slug'):
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ detail: 'no such task id' }),
        });

      case url.includes('transform/dbt_project/sources_models'):
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: '49f489a3-f223-46f9-9cf1-93e166626f4e',
                source_name: 'intermediate',
                input_name: 'sheet2_mod2',
                input_type: 'source',
                schema: 'intermediate',
                type: 'src_model_node',
              },
            ]),
        });

      case url.includes('dbt/run_dbt_via_celery'):
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              task_id: '5ce315c9-16c3-46dd-91e0-1016ad1br50f',
            }),
        });

      case url.includes('tasks/5ce315c9-16c3-46dd-91e0-1016ad1br50f'):
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              progress: [
                {
                  message: 'started',
                  status: 'running',
                },
              ],
            }),
        });
      default:
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not Found' }),
        });
    }
  });

  const flowEditor = (canvasContext = mockFlowEditorCanvasContext) => (
    <GlobalContext.Provider value={mockGlobalContext}>
      <DbtRunLogsUpdateContext.Provider value={mockDbtRunLogsContext}>
        <CanvasActionContext.Provider value={canvasContext}>
          <FlowEditor />
        </CanvasActionContext.Provider>
      </DbtRunLogsUpdateContext.Provider>
    </GlobalContext.Provider>
  );

  test('renders FlowEditor component', async () => {
    render(flowEditor());
    await waitFor(() => {
      // Canvas header should render with "Workflow" text
      expect(screen.getByText('Workflow')).toBeInTheDocument();
    });
  });

  test('handles run workflow action', async () => {
    const mockCanvasAction = { type: 'run-workflow' };
    render(
      flowEditor({
        canvasAction: mockCanvasAction,
      })
    );

    await waitFor(() => {
      expect(mockDbtRunLogsContext).toHaveBeenCalled();
    });
  });
});
