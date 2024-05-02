import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AggregationOpForm from '../AggregationOpForm'; // Adjust import as needed
import { GlobalContext } from '@/contexts/ContextProvider'; // Adjust import as needed
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
    yPos: 100,
    selected: false,
    isConnectable: true,
    sourcePosition: 'bottom',
    targetPosition: 'top',
    dragging: false,
    zIndex: 0,
  } as SrcModelNodeType,
  operation: {
    label: 'Aggregate',
    slug: 'aggregate',
    infoToolTip:
      'Performs a calculation on multiple values in a column and returns a new column with that value in every row',
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
        json: () =>
          Promise.resolve({
            id: 'fake-id',
            output_cols: [
              '_airbyte_extracted_at',
              '_airbyte_meta',
              '_airbyte_raw_id',
              'Bacteriological',
              'District_Name',
              'Iron',
              'Latitude',
              'Longitude',
              'Multiple',
              'Nitrate',
              'Physical',
              'salinity',
              'SNo_',
              'State',
              'District aggregate',
            ],
            config: {
              config: {
                aggregate_on: [
                  {
                    operation: 'avg',
                    column: 'District_Name',
                    output_column_name: 'District aggregate',
                  },
                ],
                source_columns: [
                  '_airbyte_extracted_at',
                  '_airbyte_meta',
                  '_airbyte_raw_id',
                  'Bacteriological',
                  'District_Name',
                  'Iron',
                  'Latitude',
                  'Longitude',
                  'Multiple',
                  'Nitrate',
                  'Physical',
                  'salinity',
                  'SNo_',
                  'State',
                ],
                other_inputs: [],
              },
              type: 'aggregate',
              input_models: [
                {
                  uuid: 'fake-uuid',
                  name: 'sheet2_mod2',
                  display_name: 'sheet2_mod2',
                  source_name: 'intermediate',
                  schema: 'intermediate',
                  type: 'source',
                },
              ],
            },
            type: 'operation_node',
            target_model_id: 'fake-model-d',
            seq: 1,
            chain_length: 1,
            is_last_in_chain: true,
          }),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const aggregationOpForm = (
  <GlobalContext.Provider value={mockContext}>
    <AggregationOpForm {...props} />
  </GlobalContext.Provider>
);

describe('AggregationOpForm', () => {
  it('renders correct initial form state', async () => {
    render(aggregationOpForm);
    await waitFor(() => {
      expect(screen.getByLabelText('Select Column to Aggregate*')).toHaveValue(
        ''
      );
      expect(screen.getByLabelText('Aggregate*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(aggregationOpForm);
    // Simulate form submission
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(
        screen.getByText('Column to aggregate is required')
      ).toBeInTheDocument();
      expect(screen.getByText('Operation is required')).toBeInTheDocument();
      expect(
        screen.getByText('Output column name is required')
      ).toBeInTheDocument();
    });

    const column = screen.getByTestId('aggregateColumn');
    const operation = screen.getByTestId('operation');
    const [columnInput] = screen.getAllByRole('combobox');

    await user.type(columnInput, 's');
    await fireEvent.keyDown(column, { key: 'ArrowDown' });
    await fireEvent.keyDown(column, { key: 'Enter' });

    await fireEvent.keyDown(operation, { key: 'ArrowDown' });
    await fireEvent.keyDown(operation, { key: 'ArrowDown' });
    await fireEvent.keyDown(operation, { key: 'Enter' });

    // Simulate user typing in the Output Column Name
    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'District aggregate');

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });

    // reset to initial state after submit
    await waitFor(() => {
      expect(screen.getByLabelText('Select Column to Aggregate*')).toHaveValue(
        ''
      );
      expect(screen.getByLabelText('Aggregate*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
  });
});
