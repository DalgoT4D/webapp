import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  getByTestId,
} from '@testing-library/react';

import CreateOrgTaskForm from '../CreateOrgTaskForm';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';

import { Session } from 'next-auth';
import {
  successToast,
  errorToast,
} from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../../ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
  successToast: jest.fn(),
}));

const mockSession: Session = {
  expires: 'false',
  user: { email: 'a' },
};

const mockGlobalContext = {
  state: {},
  dispatch: jest.fn(),
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
        <CreateOrgTaskForm
          mutate={mockMutate}
          showForm={true}
          setShowForm={mockSetShowForm}
        />
      </GlobalContext.Provider>
    );
  };

  it('renders the form correctly', async () => {
    setup();

    // Check if the form elements are rendered
    expect(screen.getByTestId('taskList')).toBeInTheDocument();
    expect(screen.getByTestId('connectionautocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('optionsList')).toBeInTheDocument();
    expect(screen.getByTestId('taskList')).toBeInTheDocument();
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
    expect(screen.getByTestId('closebutton')).toBeInTheDocument();
  });

  // it('fetches and displays tasks correctly', async () => {
  //   const mockTasks = [
  //     { id: 'task-1', label: 'Task-1' },
  //     { id: 'task-2', label: 'Task-2' },
  //   ];
  //   global.fetch = jest.fn(() =>
  //     Promise.resolve({
  //       json: () => Promise.resolve(mockTasks),
  //     })

  //   ) as jest.Mock;

  //   setup();

  //   const taskListAutoComplete = screen.getByTestId('taskList');

  //   expect(taskListAutoComplete).toBeInTheDocument();
  //   const input = within(taskListAutoComplete).getByRole('combobox');
  //   taskListAutoComplete.focus();
  //   await waitFor(() => {
  //     fireEvent.change(input, { target: { value: 'Task-1' } });
  //   });
  //   await waitFor(() => {
  //     fireEvent.keyDown(taskListAutoComplete, { key: 'ArrowDown' });
  //   });
  //   await waitFor(() => {
  //     fireEvent.keyDown(taskListAutoComplete, { key: 'Enter' });
  //   });
  //   await waitFor(()=>{
  //       expect(input).toHaveValue('Task-1');
  //   })

  //   //     const button = within(taskListAutoComplete).findByRole("button");
  //   //    (await button).click();
  //   //    expect(screen.getByRole("presentation")).toHaveClass("base-Popper-root");
  // });

  it('submits the form with correct data', async () => {
    const mockConfig = {
      flags: ['flag1', 'flag2'],
      options: ['option1', 'option2'],
    };
    global.fetch = jest.fn((url) => {
      if (url.endsWith('/tasks/')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              { id: 'task-1', label: 'Task 1' },
              { id: 'task-2', label: 'Task 2' },
            ]),
        });
      }
      if (url.includes('/tasks/task-1/config/')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockConfig),
        });
      }
      if (url.endsWith('/prefect/tasks/')) {
        return Promise.resolve({
          json: () => Promise.resolve({}),
        });
      }
      return Promise.reject(new Error('not found'));
    }) as jest.Mock;

    setup();

    // Select a task
    fireEvent.click(screen.getByLabelText(/Select task/i));
    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.click(screen.getByText('Task 1'));

    // Select a flag
    fireEvent.click(screen.getByLabelText(/Flags/i));
    await waitFor(() => screen.getByText('flag1'));
    fireEvent.click(screen.getByText('flag1'));

    // Add an option
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByLabelText(/Options/i), {
      target: { value: 'option1' },
    });

    // Submit the form
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/prefect/tasks/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            task_slug: 'task-1',
            flags: ['flag1'],
            options: { option1: '' },
          }),
        })
      );
    });

    expect(successToast).toHaveBeenCalledWith(
      'Org Task created successfully',
      [],
      mockGlobalContext
    );
  });

  it('handles form submission errors', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Submission error'))
    ) as jest.Mock;

    setup();

    // Submit the form without any data
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith(
        'Submission error',
        [],
        mockGlobalContext
      );
    });
  });

  it('handles form close correctly', () => {
    setup();
    fireEvent.click(screen.getByTestId("closebutton"));
    expect(screen.getByTestId("taskform")).not.toBeInTheDocument();
    expect(mockGlobalContext.dispatch).toHaveBeenCalled();
  });
});
