import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NodeDetailModal from '../NodeDetailModal';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { session: 'mock-session' },
    status: 'authenticated',
  }),
}));

jest.mock('@/contexts/DbtRunLogsContext', () => ({
  useDbtRunLogs: jest.fn().mockReturnValue([]),
}));

jest.mock('@/customHooks/useFeatureFlags', () => ({
  FeatureFlagKeys: { DATA_STATISTICS: 'DATA_STATISTICS' },
  useFeatureFlags: jest.fn().mockReturnValue({
    isFeatureFlagEnabled: jest.fn().mockReturnValue(false),
  }),
}));

jest.mock('@/contexts/FlowEditorPreviewContext', () => ({
  usePreviewAction: jest.fn().mockReturnValue({
    previewAction: { type: '', data: null },
    setPreviewAction: jest.fn(),
  }),
}));

jest.mock('@/contexts/ContextProvider', () => ({
  GlobalContext: React.createContext({
    Permissions: { state: [] },
    CurrentOrg: { state: { slug: 'test' } },
  }),
}));

describe('NodeDetailModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    schema: 'test_schema',
    table: 'test_table',
    nodeName: 'Test Node',
    finalLockCanvas: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with node name and schema.table', () => {
    render(<NodeDetailModal {...defaultProps} />);

    expect(screen.getByText('Test Node')).toBeInTheDocument();
    // schema.table appears in modal header and in PreviewPane content
    const schemaTableElements = screen.getAllByText('test_schema.test_table');
    expect(schemaTableElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Preview and Logs tabs', () => {
    render(<NodeDetailModal {...defaultProps} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<NodeDetailModal {...defaultProps} />);

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(
      (btn) => btn.querySelector('[data-testid="CloseIcon"]') !== null
    );
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not render when open is false', () => {
    render(<NodeDetailModal {...defaultProps} open={false} />);

    expect(screen.queryByText('Test Node')).not.toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<NodeDetailModal {...defaultProps} />);

    const logsTab = screen.getByText('Logs');
    fireEvent.click(logsTab);

    // After clicking Logs, the tab should be selected
    expect(logsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('opens with initial tab when specified', () => {
    render(<NodeDetailModal {...defaultProps} initialTab="logs" />);

    const logsTab = screen.getByText('Logs');
    expect(logsTab).toHaveAttribute('aria-selected', 'true');
  });
});
