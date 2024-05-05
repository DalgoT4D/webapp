import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArithmeticOpForm from '../ArithmeticOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import { SrcModelNodeType } from '../../../Canvas';
import userEvent from '@testing-library/user-event';

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
  node: {
    id: 'fake-id',
    data: {
      id: 'fake-id',
      source_name: 'intermediate',
      input_name: 'sheet2_mod2',
      input_type: 'source',
      schema: 'intermediate',
      type: 'src_model_node',
    },
    type: 'src_model_node',
    xPos: 100,
    yPos: 200,
    selected: false,
    isConnectable: true,
    sourcePosition: 'bottom',
    targetPosition: 'top',
    dragging: false,
    zIndex: 0,
  } as SrcModelNodeType,
  operation: {
    label: 'Arithmetic',
    slug: 'arithmetic',
    infoToolTip:
      'Perform arithmetic operations on or between one or more columns',
  },
  sx: { marginLeft: '10px' },
  continueOperationChain: continueOperationChainMock,
  action: 'create',
  setLoading: jest.fn(),
};

(global as any).fetch = jest.fn((url: string) => {
  console.log('sscs', url);
  switch (true) {
    case url.includes('warehouse/table_columns/intermediate/sheet2_mod2'):
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              name: 'salinity',
              data_type: 'character varying',
            },
            {
              name: 'Multiple',
              data_type: 'character varying',
            },
            {
              name: 'Iron',
              data_type: 'character varying',
            },
            {
              name: 'Latitude',
              data_type: 'character varying',
            },
            {
              name: 'Longitude',
              data_type: 'character varying',
            },
            {
              name: 'Physical',
              data_type: 'character varying',
            },
            {
              name: 'Nitrate',
              data_type: 'character varying',
            },
            {
              name: 'State',
              data_type: 'character varying',
            },
            {
              name: 'District_Name',
              data_type: 'character varying',
            },
            {
              name: 'SNo_',
              data_type: 'character varying',
            },
            {
              name: '_airbyte_raw_id',
              data_type: 'character varying',
            },
            {
              name: '_airbyte_extracted_at',
              data_type: 'timestamp with time zone',
            },
            {
              name: '_airbyte_meta',
              data_type: 'jsonb',
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

const arithmeticForm = (
  <GlobalContext.Provider value={mockContext}>
    <ArithmeticOpForm {...props} />
  </GlobalContext.Provider>
);

describe('AggregationOpForm', () => {
  it('renders correct initial form state', async () => {
    render(arithmeticForm);
    await waitFor(() => {
      expect(screen.getByLabelText('Operation*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(arithmeticForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    // Simulate form submission
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Operation is required')).toBeInTheDocument();
      expect(screen.getAllByText('Column is required')).toHaveLength(2);
      expect(
        screen.getByText('Output column name is required')
      ).toBeInTheDocument();
    });

    const operation = screen.getByTestId('operation');

    await fireEvent.keyDown(operation, { key: 'ArrowDown' });
    await fireEvent.keyDown(operation, { key: 'ArrowDown' });
    await fireEvent.keyDown(operation, { key: 'Enter' });

    const column1 = screen.getByTestId('column0');
    await fireEvent.keyDown(column1, { key: 'ArrowDown' });
    await fireEvent.keyDown(column1, { key: 'ArrowDown' });
    await fireEvent.keyDown(column1, { key: 'Enter' });

    const column2 = screen.getByTestId('column1');
    await fireEvent.keyDown(column2, { key: 'ArrowDown' });
    await fireEvent.keyDown(column2, { key: 'ArrowDown' });
    await fireEvent.keyDown(column2, { key: 'Enter' });

    // Simulate user typing in the Output Column Name
    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Sum');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });

    // reset to initial state after submit
    await waitFor(() => {
      expect(screen.getByLabelText('Operation*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
    });
  });
});
