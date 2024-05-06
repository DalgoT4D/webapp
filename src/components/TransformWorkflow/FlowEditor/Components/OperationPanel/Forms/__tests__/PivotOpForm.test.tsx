import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PivotOpForm from '../PivotOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { intermediateTableResponse, mockNode } from './helpers';
import { ReactFlowProvider } from 'reactflow';

const user = userEvent.setup();
// Mock global context and session

const continueOperationChainMock = jest.fn();
const mockContext = {
  Toast: { state: null, dispatch: jest.fn() },
};

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      expires: '2021-05-27T00:00:00.000Z',
    },
  }),
}));

const props: OperationFormProps = {
  node: mockNode,
  operation: {
    label: 'Join',
    slug: 'join',
    infoToolTip:
      'Combine rows from two or more tables, based on a related (key) column between them',
  },
  sx: { marginLeft: '10px' },
  continueOperationChain: continueOperationChainMock,
  action: 'create',
  setLoading: jest.fn(),
};

(global as any).fetch = jest.fn((url: string) => {
  switch (true) {
    case url.includes('warehouse/table_columns/intermediate/sheet2_mod2'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(intermediateTableResponse),
      });

    case url.includes('transform/dbt_project/model'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const pivotForm = (
  <GlobalContext.Provider value={mockContext}>
    <PivotOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Pivot form', () => {
  it('renders correct initial form state', async () => {
    render(pivotForm);
    await waitFor(() => {
      expect(
        screen.getByText('Select Column to pivot on*')
      ).toBeInTheDocument();
      expect(screen.getByText('Column values to pivot on')).toBeInTheDocument();
      expect(screen.getByText('Columns to groupby')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(pivotForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Pivot Column is required')).toBeInTheDocument();
      expect(
        screen.getByText('Atleast one value is required')
      ).toBeInTheDocument();
    });

    const pivot = screen.getByTestId('pivot');

    await fireEvent.keyDown(pivot, { key: 'ArrowDown' });
    await fireEvent.keyDown(pivot, { key: 'ArrowDown' });
    await fireEvent.keyDown(pivot, { key: 'Enter' });

    const columnValue0 = screen
      .getByTestId('columnValue0')
      .querySelector('input') as HTMLInputElement;

    await user.type(columnValue0, '100');

    await user.click(screen.getByTestId('addcase'));

    const columnValue1 = screen
      .getByTestId('columnValue1')
      .querySelector('input') as HTMLInputElement;

    await user.type(columnValue1, '200');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
