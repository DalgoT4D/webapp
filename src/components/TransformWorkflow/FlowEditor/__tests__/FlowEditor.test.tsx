import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

jest.mock('react-resizable', () => ({
  ResizableBox: jest.fn(({ children }) => {
    return <div data-testid="mock-resizable-box">{children}</div>;
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
              {
                label: 'DBT deps',
                slug: 'dbt-deps',
                id: 180,
                uuid: '1603b541-df3b-40ea-a721-1ded738636d3',
                deploymentId: null,
                lock: null,
                command: 'dbt deps',
                generated_by: 'system',
                seq: 3,
              },
              {
                label: 'DBT test',
                slug: 'dbt-test',
                id: 182,
                uuid: '3441ea62-52c5-4b50-862e-bc0415ba7702',
                deploymentId: null,
                lock: null,
                command: 'dbt test',
                generated_by: 'system',
                seq: 5,
              },
              {
                label: 'DBT docs generate',
                slug: 'dbt-docs-generate',
                id: 183,
                uuid: '673fc167-02be-449e-9335-09ccd2723840',
                deploymentId: null,
                lock: null,
                command: 'dbt docs generate',
                generated_by: 'system',
                seq: 6,
              },
              {
                label: 'DBT clean',
                slug: 'dbt-clean',
                id: 179,
                uuid: 'b0467b54-14d8-4779-b750-c2e3b8f07a67',
                deploymentId: null,
                lock: null,
                command: 'dbt clean',
                generated_by: 'system',
                seq: 2,
              },
              {
                label: 'DBT run',
                slug: 'dbt-run',
                id: 187,
                uuid: 'e894d03c-ba00-4161-b0d8-49a40786c0c3',
                deploymentId: '8f269b11-2f90-43e9-a71d-7c84919ed4d6',
                lock: null,
                command: 'dbt run --full-refresh',
                generated_by: 'client',
                seq: 4,
              },
              {
                label: 'DBT seed',
                slug: 'dbt-seed',
                id: 186,
                uuid: '70fbdb0d-3abf-4b37-866b-e0d749a81471',
                deploymentId: null,
                lock: null,
                command: 'dbt seed',
                generated_by: 'client',
                seq: 0,
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
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });
  });

  test('switches between Preview and Logs tabs', async () => {
    render(flowEditor());

    const previewTab = screen.getByText('Preview');
    const logsTab = screen.getByText('Logs');

    expect(previewTab).toHaveAttribute('aria-selected', 'false');
    expect(logsTab).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(logsTab);

    expect(previewTab).toHaveAttribute('aria-selected', 'false');
    expect(logsTab).toHaveAttribute('aria-selected', 'true');
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
