import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UnpivotOpForm from '../UnpivotOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import {
  intermediateTableResponse,
  mockNode,
  sourceModelsMock,
} from './helpers';
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
    label: 'Rename',
    slug: 'renamecolumns',
    infoToolTip: 'Select columns and rename them',
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

    case url.includes('transform/dbt_project/sources_models'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sourceModelsMock),
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

const unpivotForm = (
  <ReactFlowProvider>
    <GlobalContext.Provider value={mockContext}>
      <UnpivotOpForm {...props} />
    </GlobalContext.Provider>
  </ReactFlowProvider>
);

describe('Unpivot form', () => {
  it('renders correct initial form state', async () => {
    render(unpivotForm);
    await waitFor(() => {
      expect(screen.getByText('Columns to unpivot')).toBeInTheDocument();
      expect(
        screen.getByText('Columns to keep in output table')
      ).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(unpivotForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(
        screen.getByText('Atleast one column required to unpivot')
      ).toBeInTheDocument();
    });

    const unpivotColumn1 = screen.getByTestId('unpivotColumn1');
    const unpivotColumn2 = screen.getByTestId('unpivotColumn2');

    await user.click(unpivotColumn1);
    await user.click(unpivotColumn2);

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
