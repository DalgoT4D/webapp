import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JoinOpForm from '../JoinOpForm';
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

    case url.includes('warehouse/table_columns/intermediate/sheet2_mod'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(intermediateTableResponse),
      });

    case url.includes('transform/dbt_project/sources_models'):
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 'fake-id-1',
              source_name: 'intermediate',
              input_name: 'sheet2_mod',
              input_type: 'source',
              schema: 'intermediate',
              type: 'src_model_node',
            },
            {
              id: 'fake-id-2',
              source_name: 'intermediate',
              input_name: 'sheet2_mod2',
              input_type: 'source',
              schema: 'intermediate',
              type: 'src_model_node',
            },
          ]),
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

const joinForm = (
  <ReactFlowProvider>
    <GlobalContext.Provider value={mockContext}>
      <JoinOpForm {...props} />
    </GlobalContext.Provider>
  </ReactFlowProvider>
);

describe('Join form', () => {
  it('renders correct initial form state', async () => {
    render(joinForm);
    await waitFor(() => {
      expect(screen.getByText('Select the first table*')).toBeInTheDocument();
      expect(screen.getAllByText('Select key column*')).toHaveLength(2);
      expect(screen.getByText('Select the second table*')).toBeInTheDocument();
      expect(screen.getByText('Select the join type*')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(joinForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getAllByText('Key column is required')).toHaveLength(2);
      expect(screen.getByText('Second table is required')).toBeInTheDocument();
      expect(screen.getByText('Join type is required')).toBeInTheDocument();
    });

    const table1Key = screen.getByTestId('table1key');

    await fireEvent.keyDown(table1Key, { key: 'ArrowDown' });
    await fireEvent.keyDown(table1Key, { key: 'ArrowDown' });
    await fireEvent.keyDown(table1Key, { key: 'Enter' });

    const secondTable = screen.getByTestId('table2');

    await fireEvent.keyDown(secondTable, { key: 'ArrowDown' });
    await fireEvent.keyDown(secondTable, { key: 'ArrowDown' });
    await fireEvent.keyDown(secondTable, { key: 'Enter' });

    const table2Key = await screen.getByTestId('table2key');

    await fireEvent.keyDown(table2Key, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getAllByRole('option')[0]).toHaveTextContent(
        '_airbyte_extracted_at'
      );
    });
    await fireEvent.keyDown(table2Key, { key: 'ArrowDown' });
    await fireEvent.keyDown(table2Key, { key: 'Enter' });

    const joinType = await screen.getByTestId('joinType');

    await fireEvent.keyDown(joinType, { key: 'ArrowDown' });
    await fireEvent.keyDown(joinType, { key: 'ArrowDown' });
    await fireEvent.keyDown(joinType, { key: 'Enter' });

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
