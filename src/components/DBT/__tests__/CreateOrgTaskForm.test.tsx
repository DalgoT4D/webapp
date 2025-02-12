import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreateOrgTaskForm from '../CreateOrgTaskForm';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';

import { Session } from 'next-auth';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';
import { TASK_DBTCLOUD_JOB } from '@/config/constant';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../../ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
  successToast: jest.fn(),
}));

jest.mock('@/helpers/http', () => ({
  httpGet: jest.fn(),
  httpPost: jest.fn(),
}));

jest.mock('@/contexts/TrackingContext', () => ({
  useTracking: () => jest.fn(),
}));

const mockSession: Session = {
  expires: 'false',
  user: { email: 'a' },
};

const mockGlobalContext = {
  state: {},
  dispatch: jest.fn(),
  Permissions: {},
  Toast: {
    showToast: jest.fn(),
    hideToast: jest.fn(),
  },
  CurrentOrg: null,
  OrgUsers: [],
  UnsavedChanges: false,
};

describe('CreateOrgTaskForm', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    const mockMutate = jest.fn();
    const mockSetShowForm = jest.fn();

    return render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <CreateOrgTaskForm mutate={mockMutate} showForm={true} setShowForm={mockSetShowForm} />
      </GlobalContext.Provider>
    );
  };

  it('renders the form correctly', async () => {
    setup();

    // Check if the form elements are rendered
    expect(screen.getByTestId('taskList')).toBeInTheDocument();
    expect(screen.getByTestId('connectionautocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('optionsListItems')).toBeInTheDocument();
    expect(screen.getByTestId('taskList')).toBeInTheDocument();
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
    expect(screen.getByTestId('closebutton')).toBeInTheDocument();
  });

  it('handles form close correctly', async () => {
    setup();
    fireEvent.click(screen.getByTestId('closebutton'));
    await waitFor(() => {
      expect(screen.queryByTestId('taskform')).not.toBeInTheDocument();
    });
  });

  it('loads master tasks on mount', async () => {
    const mockTasks = [
      { slug: 'task1', label: 'Task 1' },
      { slug: 'task2', label: 'Task 2' },
    ];

    (httpGet as jest.Mock).mockResolvedValueOnce(mockTasks);

    setup();

    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/');
    });
  });

  it('handles error when loading master tasks', async () => {
    const error = new Error('Failed to load tasks');
    (httpGet as jest.Mock).mockRejectedValueOnce(error);

    setup();

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Failed to load tasks', [], mockGlobalContext);
    });
  });

  it('loads task configuration when a task is selected', async () => {
    const mockTasks = [{ slug: 'task1', label: 'Task 1' }];
    const mockConfig = {
      flags: ['flag1', 'flag2'],
      options: ['option1', 'option2'],
    };

    (httpGet as jest.Mock).mockResolvedValueOnce(mockTasks).mockResolvedValueOnce(mockConfig);

    setup();

    // Wait for tasks to load
    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/');
    });

    const selectTaskAutoComplete = screen.getByTestId('selecttask');
    const selectedTaskValue = within(selectTaskAutoComplete).getByRole('combobox');
    selectTaskAutoComplete.focus();
    await fireEvent.change(selectedTaskValue, {
      target: { value: 'task1' },
    });
    fireEvent.keyDown(selectTaskAutoComplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(selectTaskAutoComplete, { key: 'Enter' }));

    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/task1/config/');
    });
  });

  it('handles options addition and removal', async () => {
    setup();

    // Add new option
    const addButton = screen.getByTestId('add-option-button');
    fireEvent.click(addButton);

    // Check if new option fields are added
    const optionFields = screen.getAllByTestId('optionsListItems');
    expect(optionFields).toHaveLength(2);

    // Remove an option
    const removeButton = screen.getByTestId('remove-option-button-0');
    fireEvent.click(removeButton);

    // Check if option is removed
    await waitFor(() => {
      const updatedOptionFields = screen.getAllByTestId('optionsListItems');
      expect(updatedOptionFields).toHaveLength(1);
    });
  });

  it('successfully submits the form with dbt-run task without options', async () => {
    const mockTasks = [{ slug: 'dbt-run', label: 'dbt-run' }];
    const mockConfig = {
      flags: ['full-refresh', 'fail-fast'],
      options: ['select', 'exclude'],
    };

    (httpGet as jest.Mock)
      .mockResolvedValueOnce(mockTasks) // For initial tasks load
      .mockResolvedValueOnce(mockConfig); // For task config load

    (httpPost as jest.Mock).mockResolvedValueOnce({ success: true });

    setup();

    // Wait for tasks to load
    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/');
    });

    // Select the task
    const selectTaskAutoComplete = screen.getByTestId('selecttask');
    const selectedTaskValue = within(selectTaskAutoComplete).getByRole('combobox');
    await userEvent.type(selectedTaskValue, 'dbt-run');

    // Wait for the dropdown to appear and select the option
    const option = await screen.findByText('dbt-run');
    await userEvent.click(option);

    // Wait for config to load
    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/dbt-run/config/');
    });

    // Submit form
    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    // Verify the POST request
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(
        mockSession,
        'prefect/tasks/',
        expect.objectContaining({
          task_slug: 'dbt-run',
          flags: [],
          options: {},
        })
      );
    });
  });

  it('successfully submits the form with task and options', async () => {
    const mockTasks = [
      {
        type: 'git',
        slug: 'git-pull',
        label: 'GIT pull',
        command: 'pull',
        is_system: true,
      },
      {
        type: 'dbt',
        slug: 'dbt-clean',
        label: 'DBT clean',
        command: 'clean',
        is_system: true,
      },
      {
        type: 'dbt',
        slug: 'dbt-run',
        label: 'DBT run',
        command: 'run',
        is_system: true,
      },
      {
        type: 'dbt',
        slug: 'dbt-deps',
        label: 'DBT deps',
        command: 'deps',
        is_system: true,
      },

      {
        type: 'dbt',
        slug: 'dbt-test',
        label: 'DBT test',
        command: 'test',
        is_system: true,
      },
      {
        type: 'dbt',
        slug: 'dbt-docs-generate',
        label: 'DBT docs generate',
        command: 'docs generate',
        is_system: true,
      },
      {
        type: 'dbt',
        slug: 'dbt-seed',
        label: 'DBT seed',
        command: 'seed',
        is_system: true,
      },
    ];
    const mockConfig = {
      flags: ['full-refresh', 'fail-fast'],
      options: ['select', 'exclude'],
    };

    (httpGet as jest.Mock).mockResolvedValueOnce(mockTasks).mockResolvedValueOnce(mockConfig);

    (httpPost as jest.Mock).mockResolvedValueOnce({ success: true });

    setup();

    // Wait for tasks to load
    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/');
    });

    // Select the task
    const selectTaskAutoComplete = screen.getByTestId('selecttask');
    const selectedTaskValue = within(selectTaskAutoComplete).getByRole('combobox');
    selectTaskAutoComplete.focus();
    await fireEvent.change(selectedTaskValue, {
      target: { value: 'dbt-run' },
    });
    fireEvent.keyDown(selectTaskAutoComplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(selectTaskAutoComplete, { key: 'Enter' }));

    // Wait for config to load and options to be rendered
    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'data/tasks/dbt-run/config/');
    });

    // Submit form
    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    // Verify the POST request
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(
        mockSession,
        'prefect/tasks/',
        expect.objectContaining({
          task_slug: 'dbt-run',
          flags: [],
          options: {},
        })
      );
    });
  });

  it('checks if task is DBT Cloud task', async () => {
    const mockTasks = [{ slug: TASK_DBTCLOUD_JOB, label: 'DBT Cloud Job' }];
    (httpGet as jest.Mock).mockResolvedValueOnce(mockTasks);

    setup();

    const selectTaskAutoComplete = screen.getByTestId('selecttask');
    const selectedTaskValue = within(selectTaskAutoComplete).getByRole('combobox');
    selectTaskAutoComplete.focus();
    await fireEvent.change(selectedTaskValue, {
      target: { value: TASK_DBTCLOUD_JOB },
    });
    fireEvent.keyDown(selectTaskAutoComplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(selectTaskAutoComplete, { key: 'Enter' }));

    // Command preview should not be visible for DBT Cloud tasks
    await waitFor(() => {
      expect(screen.queryByText(/Command:/)).toBeInTheDocument();
    });
  });
});
