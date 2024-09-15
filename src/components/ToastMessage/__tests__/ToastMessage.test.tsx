// ToastMessage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastMessage from '../ToastMessage';
import { ToastStateInterface } from '@/contexts/reducers/ToastReducer';

describe('ToastMessage Component', () => {
  const mockHandleClose = jest.fn();

  const singleMessageProps: ToastStateInterface = {
    open: true,
    severity: 'success',
    seconds: 3,
    message: 'This is a single message',
    messages: [],
    handleClose: mockHandleClose,
  };

  const multipleMessagesProps: ToastStateInterface = {
    open: true,
    severity: 'error',
    seconds: 3,
    message: '',
    messages: ['First message', 'Second message', 'Third message'],
    handleClose: mockHandleClose,
  };

  it('renders correctly with a single message', () => {
    render(<ToastMessage {...singleMessageProps} />);

    expect(screen.getByText('This is a single message')).toBeInTheDocument();
  });

  it('renders correctly with multiple messages', () => {
    render(<ToastMessage {...multipleMessagesProps} />);

    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByText('Third message')).toBeInTheDocument();
  });

  it('calls handleClose when close button is clicked', () => {
    render(<ToastMessage {...singleMessageProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockHandleClose).toHaveBeenCalled();
  });

  it('calls handleClose after autoHideDuration', () => {
    jest.useFakeTimers();
    render(<ToastMessage {...singleMessageProps} />);

    jest.advanceTimersByTime(singleMessageProps.seconds * 1000);
    expect(mockHandleClose).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
