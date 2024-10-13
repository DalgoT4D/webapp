import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '../TopBar';

describe('TopBar Component', () => {
  const mockHandleOpenSavedSession = jest.fn();
  const mockHandleNewSession = jest.fn();

  const defaultProps = {
    handleOpenSavedSession: mockHandleOpenSavedSession,
    handleNewSession: mockHandleNewSession,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders TopBar component with correct buttons and tooltip', () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.getByText('Parameters')).toBeInTheDocument();

    // Check if "Saved Sessions" button is rendered
    expect(screen.getByText('Saved Sessions')).toBeInTheDocument();

    // Check if "+ New" button is rendered
    expect(screen.getByText('+ New')).toBeInTheDocument();
  });

  test('calls handleOpenSavedSession when "Saved Sessions" button is clicked', () => {
    render(<TopBar {...defaultProps} />);

    const savedSessionsButton = screen.getByText('Saved Sessions');
    fireEvent.click(savedSessionsButton);

    expect(mockHandleOpenSavedSession).toHaveBeenCalledTimes(1);
  });

  test('calls handleNewSession when "+ New" button is clicked', () => {
    render(<TopBar {...defaultProps} />);

    const newButton = screen.getByText('+ New');
    fireEvent.click(newButton);

    expect(mockHandleNewSession).toHaveBeenCalledTimes(1);
  });
});
