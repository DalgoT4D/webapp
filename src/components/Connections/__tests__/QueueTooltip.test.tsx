import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueueTooltip } from '../Connections';
import { QueuedRuntimeInfo } from '../Connections';

// Mock the MUI Tooltip component to make testing easier
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Tooltip: ({ children, title }: { children: React.ReactNode; title: React.ReactNode }) => (
    <div data-testid="tooltip">
      <div data-testid="tooltip-title">{title}</div>
      {children}
    </div>
  ),
}));

describe('QueueTooltip', () => {
  const validQueueInfo: QueuedRuntimeInfo = {
    queue_no: 5,
    min_wait_time: 300,
    max_wait_time: 600,
  };

  it('renders ScheduleIcon when queueInfo is null', () => {
    render(<QueueTooltip queueInfo={null} />);
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders ScheduleIcon when queue_no is zero', () => {
    render(
      <QueueTooltip
        queueInfo={{
          ...validQueueInfo,
          queue_no: 0,
        }}
      />
    );
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders ScheduleIcon when queue_no is negative', () => {
    render(
      <QueueTooltip
        queueInfo={{
          ...validQueueInfo,
          queue_no: -1,
        }}
      />
    );
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders ScheduleIcon when min_wait_time is zero', () => {
    render(
      <QueueTooltip
        queueInfo={{
          ...validQueueInfo,
          min_wait_time: 0,
        }}
      />
    );
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders ScheduleIcon when min_wait_time is negative', () => {
    render(
      <QueueTooltip
        queueInfo={{
          ...validQueueInfo,
          min_wait_time: -1,
        }}
      />
    );
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders ScheduleIcon when max_wait_time is zero', () => {
    render(
      <QueueTooltip
        queueInfo={{
          ...validQueueInfo,
          max_wait_time: 0,
        }}
      />
    );
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders ScheduleIcon when max_wait_time is negative', () => {
    render(
      <QueueTooltip
        queueInfo={{
          ...validQueueInfo,
          max_wait_time: -1,
        }}
      />
    );
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders tooltip with queue information when all values are valid', () => {
    render(<QueueTooltip queueInfo={validQueueInfo} />);
    const tooltip = screen.getByTestId('tooltip');
    const tooltipTitle = screen.getByTestId('tooltip-title');

    expect(tooltip).toBeInTheDocument();
    expect(tooltipTitle).toBeInTheDocument();

    // Check for specific text content in the tooltip
    expect(tooltipTitle).toHaveTextContent('Queue Information');
    expect(tooltipTitle).toHaveTextContent('Position in queue: 5');
    expect(tooltipTitle).toHaveTextContent('Estimated wait time');
  });
});
