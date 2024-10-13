import React from 'react';
import { render, screen } from '@testing-library/react';
import { LogsPane } from '../LogsPane';

jest.mock('moment', () => {
  return () => jest.requireActual('moment')('2023-07-30T12:00:00Z');
});

describe('LogsPane Component', () => {
  const defaultProps = {
    height: 500,
    dbtRunLogs: [],
    finalLockCanvas: false,
  };

  it('renders the table with logs when dbtRunLogs is not empty', () => {
    const logs = [
      { timestamp: '2023-07-30T12:00:00Z', message: 'Log message 1' },
      { timestamp: '2023-07-30T13:00:00Z', message: 'Log message 2' },
    ];
    render(<LogsPane {...defaultProps} dbtRunLogs={logs} />);

    expect(screen.getByText('Last Run')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();

    // Check if the log messages are present
    logs.forEach((log) => {
      //   expect(screen.getByText(moment(log.timestamp).format('YYYY/MM/DD'))).toBeInTheDocument();
      //   expect(screen.getByText(moment(log.timestamp).format('hh:mm:ss A '))).toBeInTheDocument();
      expect(screen.getByText(log.message)).toBeInTheDocument();
    });
  });

  it('renders the loading spinner when workflowInProgress is true and dbtRunLogs is empty', () => {
    render(<LogsPane {...defaultProps} finalLockCanvas={true} />);

    expect(screen.getByTestId('progressbar')).toBeInTheDocument();
  });

  it('renders the "Please press run" message when dbtRunLogs is empty and workflowInProgress is false', () => {
    render(<LogsPane {...defaultProps} />);

    expect(screen.getByText('Please press run')).toBeInTheDocument();
  });

  it('does not render the loading spinner when workflowInProgress is false', () => {
    render(<LogsPane {...defaultProps} />);

    expect(screen.queryByTestId('progressbar')).not.toBeInTheDocument();
  });
});
