import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UITransformTab, { TopNavBar, Transition } from '../UITransformTab';

// Mock dependencies
jest.mock('../DBTRepositoryCard', () => {
  return function MockDBTRepositoryCard({ onConnectGit }: { onConnectGit: () => void }) {
    return (
      <div data-testid="dbt-repository-card">
        <button onClick={onConnectGit} data-testid="connect-git-btn">
          Connect Git
        </button>
      </div>
    );
  };
});

jest.mock('@/components/TransformWorkflow/FlowEditor/Components/CanvasPreview', () => {
  return function MockCanvasPreview() {
    return <div data-testid="canvas-preview">Canvas Preview</div>;
  };
});

jest.mock('@/components/Workflow/Editor', () => {
  return function MockWorkflowEditor() {
    return <div data-testid="workflow-editor">Workflow Editor</div>;
  };
});

jest.mock('@/assets/images/logo.svg', () => '/mock-logo.svg');

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('UITransformTab', () => {
  const defaultProps = {
    onGitConnected: jest.fn(),
    gitConnected: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all main sections', () => {
    render(<UITransformTab {...defaultProps} />);

    expect(screen.getByTestId('dbt-repository-card')).toBeInTheDocument();
    expect(screen.getByText('Workflow 1')).toBeInTheDocument();
    expect(screen.getByTestId('gotoworkflow')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-preview')).toBeInTheDocument();
  });

  it('calls onGitConnected when git is connected', () => {
    render(<UITransformTab {...defaultProps} />);

    const connectGitButton = screen.getByTestId('connect-git-btn');
    fireEvent.click(connectGitButton);

    expect(defaultProps.onGitConnected).toHaveBeenCalledTimes(1);
  });

  it('opens workflow editor dialog when Edit Workflow button is clicked', () => {
    render(<UITransformTab {...defaultProps} />);

    const editWorkflowButton = screen.getByTestId('gotoworkflow');
    fireEvent.click(editWorkflowButton);

    expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
  });

  it('renders with git connected state', () => {
    render(<UITransformTab {...defaultProps} gitConnected={true} />);

    expect(screen.getByTestId('dbt-repository-card')).toBeInTheDocument();
    expect(screen.getByText('Workflow 1')).toBeInTheDocument();
  });
});

describe('TopNavBar', () => {
  it('renders logo and close button', () => {
    const handleClose = jest.fn();
    render(<TopNavBar handleClose={handleClose} />);

    expect(screen.getByAltText('dalgo logo')).toBeInTheDocument();
    expect(screen.getByLabelText('close')).toBeInTheDocument();
  });

  it('calls handleClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<TopNavBar handleClose={handleClose} />);

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('Transition', () => {
  it('exports Transition component', () => {
    expect(Transition).toBeDefined();
    expect(typeof Transition).toBe('object'); // forwardRef returns object
  });
});
