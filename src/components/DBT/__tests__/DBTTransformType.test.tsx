import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';


import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import DBTTransformType from '../DBTTransformType';

jest.mock('next-auth/react');
jest.mock('../../ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
  successToast: jest.fn(),
}));

const mockSession = {
  expires: 'false',
  user: { email: 'a' },
};

const mockGlobalContext = {
  Permissions: { state: ['can_create_dbt_workspace', 'can_edit_dbt_workspace'] },
  CurrentOrg: { state: { wtype: 'default' } },
  dispatch: jest.fn(),
};
describe('DBTTransformType', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    global.fetch = jest.fn((url) => {
      if (url.endsWith('dbt/dbt_workspace')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            status: 'fetched',
            gitrepo_url: 'https://github.com/example/repo',
            default_schema: 'default_schema',
          }),
        });
      }
      if (url.endsWith('prefect/tasks/transform/')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            { id: 'task-1', name: 'Task 1', lock: false },
            { id: 'task-2', name: 'Task 2', lock: true },
          ]),
        });
      }
      return Promise.reject(new Error('not found'));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setup = (transformType = 'ui') => {
    return render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DBTTransformType transformType={transformType} />
      </GlobalContext.Provider>
    );
  };

  it('renders the DBTTransformType component', async () => {
    setup();

    expect(screen.getByText('Transformation')).toBeInTheDocument();
  });

  // it('fetches DBT workspace and tasks', async () => {
  //   setup();

  //   await waitFor(() => {
  //     expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('dbt/dbt_workspace'));
  //   });

  //   await waitFor(() => {
  //     expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('prefect/tasks/transform/'));
  //   });

  //   expect(screen.getByText('DBT REPOSITORY')).toBeInTheDocument();
  //   expect(screen.getByText('https://github.com/example/repo')).toBeInTheDocument();
  //   expect(screen.getByText('default_schema')).toBeInTheDocument();

  //   await waitFor(() => {
  //     expect(screen.getByText('Task 1')).toBeInTheDocument();
  //     expect(screen.getByText('Task 2')).toBeInTheDocument();
  //   });
  // });

  it('handles error when fetching DBT workspace', async () => {
    const errorMessage = 'Failed to fetch DBT workspace';
    global.fetch = jest.fn(() => Promise.reject(new Error(errorMessage))) as jest.Mock;

    setup();

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith(errorMessage, [], mockGlobalContext);
    });
  });

  it('opens and closes the workflow editor dialog', async () => {
    const mockWorkspace = {
      status: 'fetched',
      gitrepo_url: 'https://github.com/example/repo',
      default_schema: 'default_schema',
    };

    global.fetch = jest.fn((url) => {
      if (url.endsWith('dbt/dbt_workspace')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockWorkspace),
        });
      }
      return Promise.reject(new Error('not found'));
    }) as jest.Mock;

    setup();

    // await waitFor(() => {
    //   expect(screen.getByText('SETUP')).toBeInTheDocument();
    // });

    const button = screen.getByText('Go to workflow');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
