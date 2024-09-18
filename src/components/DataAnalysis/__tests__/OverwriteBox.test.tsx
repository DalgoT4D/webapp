import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OverWriteDialog } from '../OverwriteBox';
// Disable ESLint's react/display-name for the entire file
function MockDialog({ formContent, formActions, title }) {
  return (
    <div data-testid="dialog">
      <h2>{title}</h2>
      {formContent}
      {formActions}
    </div>
  );
}

MockDialog.displayName = 'MockDialog';

jest.mock('@/components/Dialog/CustomDialog', () => MockDialog);

const mockOnSubmit = jest.fn();
const mockOnConfirmNavigation = jest.fn();
const mockSetModalName = jest.fn();
const mockSetIsBoxOpen = jest.fn();

describe('OverWriteDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    modalName: 'SAVE',
    onSubmit: mockOnSubmit,
    onConfirmNavigation: mockOnConfirmNavigation,
    setModalName: mockSetModalName,
    setIsBoxOpen: mockSetIsBoxOpen,
  };

  test('renders OverWriteDialog with correct content for "SAVE" modal', () => {
    render(<OverWriteDialog {...defaultProps} />);

    expect(screen.getByText('Save as')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Please name the configuration before saving it in the warehouse'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Save')).toBeInTheDocument();
  });

  test('displays validation error if session name is not provided', async () => {
    render(<OverWriteDialog {...defaultProps} />);

    const saveButton = screen.getByText('Save', { selector: 'button' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Session Name is required')).toBeInTheDocument();
    });
  });

  test('calls onSubmit with correct data when "Save" is clicked', async () => {
    render(<OverWriteDialog {...defaultProps} />);

    const sessionNameInput = screen.getByRole('textbox');
    fireEvent.change(sessionNameInput, { target: { value: 'Test Session' } });

    const saveButton = screen.getByText('Save', { selector: 'button' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test Session', false);
    });
  });

  test('calls onSubmit with overwrite when "Overwrite" is clicked in OVERWRITE modal', async () => {
    render(<OverWriteDialog {...defaultProps} modalName="OVERWRITE" />);

    const sessionNameInput = screen.getByLabelText('Overwrite');
    fireEvent.change(sessionNameInput, { target: { value: 'Test Session' } });

    const overwriteButton = screen.getByText('Overwrite', {
      selector: 'button',
    });
    fireEvent.click(overwriteButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test Session', true);
    });
  });

  test('calls onConfirmNavigation when "Leave anyway" is clicked in UNSAVED_CHANGES modal', async () => {
    render(<OverWriteDialog {...defaultProps} modalName="UNSAVED_CHANGES" />);

    const leaveButton = screen.getByText('Leave anyway');
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(mockOnConfirmNavigation).toHaveBeenCalledTimes(1);
    });
  });

  test('calls setModalName when "Save changes" is clicked in UNSAVED_CHANGES modal', async () => {
    render(<OverWriteDialog {...defaultProps} modalName="UNSAVED_CHANGES" />);

    const saveChangesButton = screen.getByText('Save changes');
    fireEvent.click(saveChangesButton);

    await waitFor(() => {
      expect(mockSetModalName).toHaveBeenCalledWith('OVERWRITE');
    });
  });

  test('closes the dialog when "Cancel" is clicked', async () => {
    render(<OverWriteDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockSetIsBoxOpen).toHaveBeenCalledWith(false);
    });
  });
});
