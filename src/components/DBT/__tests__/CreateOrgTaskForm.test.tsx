import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import CreateOrgTaskForm from '../CreateOrgTaskForm';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';

import { Session } from 'next-auth';
import { errorToast } from '@/components/ToastMessage/ToastHelper';


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

  it('handles form close correctly', async () => {
    setup();
    fireEvent.click(screen.getByTestId('closebutton'));
    await waitFor(() => {
      expect(screen.queryByTestId('taskform')).not.toBeInTheDocument();
    });
  });
});
