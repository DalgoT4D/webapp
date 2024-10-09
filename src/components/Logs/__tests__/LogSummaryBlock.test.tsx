// LogSummaryBlock.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { LogSummaryBlock } from '../LogSummaryBlock';

describe('LogSummaryBlock Component', () => {
  const mockSetLogsummaryLogs = jest.fn();

  const logsummaryDbtRunSuccess = {
    task_name: 'dbt run',
    status: 'success',
    log_lines: ['Log 1', 'Log 2'],
    passed: 10,
    errors: 0,
    skipped: 2,
    warnings: 1,
  };

  const logsummaryDbtTestFailed = {
    task_name: 'dbt test',
    status: 'failed',
    log_lines: ['Log 1', 'Log 2'],
    tests: [
      {
        pattern: 'test-summary',
        passed: 5,
        errors: 3,
        skipped: 1,
        warnings: 2,
      },
    ],
  };

  const logsummaryDefault = {
    task_name: 'default task',
    status: 'success',
    log_lines: ['Log 1', 'Log 2'],
    pattern: 'Some pattern',
  };

  it('renders DbtRunBlock when task_name is dbt run and status is success', () => {
    render(
      <LogSummaryBlock
        logsummary={logsummaryDbtRunSuccess}
        setLogsummaryLogs={mockSetLogsummaryLogs}
      />
    );

    expect(screen.getByText('dbt run')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('errors')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('renders DbtTestBlock when task_name is dbt test and status is failed', () => {
    render(
      <LogSummaryBlock
        logsummary={logsummaryDbtTestFailed}
        setLogsummaryLogs={mockSetLogsummaryLogs}
      />
    );

    expect(screen.getByText('dbt test')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('warnings')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('renders NameAndPatternBlock for default case', () => {
    render(
      <LogSummaryBlock logsummary={logsummaryDefault} setLogsummaryLogs={mockSetLogsummaryLogs} />
    );

    expect(screen.getByText('default task')).toBeInTheDocument();
    expect(screen.getByText('Some pattern')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('calls setLogsummaryLogs on Logs button click', () => {
    render(
      <LogSummaryBlock logsummary={logsummaryDefault} setLogsummaryLogs={mockSetLogsummaryLogs} />
    );

    fireEvent.click(screen.getByText('Logs'));
    expect(mockSetLogsummaryLogs).toHaveBeenCalledWith(logsummaryDefault.log_lines);
  });
});
