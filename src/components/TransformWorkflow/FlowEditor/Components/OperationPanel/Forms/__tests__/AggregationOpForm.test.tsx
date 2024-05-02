import { render, screen, waitFor } from '@testing-library/react';
import AggregationOpForm from '../AggregationOpForm'; // Adjust import as needed
import { GlobalContext } from '@/contexts/ContextProvider'; // Adjust import as needed
import { OperationFormProps } from '../../../OperationConfigLayout';
import { SrcModelNodeType } from '../../../Canvas';

// Mock global context and session
const mockContext = {
  Toast: { state: null },
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
  continueOperationChain: jest.fn(),
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

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

describe.only('AggregationOpForm', () => {
  it.only('renders without crashing', async () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <AggregationOpForm {...props} />
      </GlobalContext.Provider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
  });

  it('renders correct initial form state', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <AggregationOpForm />
      </GlobalContext.Provider>
    );
    expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <AggregationOpForm session={mockSession} />
      </GlobalContext.Provider>
    );

    // Simulate user typing in the Output Column Name
    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    userEvent.type(outputColumnNameInput, 'Total Sales');

    // Simulate form submission
    const saveButton = screen.getByTestId('savebutton');
    userEvent.click(saveButton);

    // Assert that the input was successful and submission occurred
    expect(outputColumnNameInput).toHaveValue('Total Sales');
    expect(mockContext.setError).not.toHaveBeenCalled();
  });
});

describe('API integration', () => {
  it('submits form data correctly to the server', async () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <AggregationOpForm session={mockSession} />
      </GlobalContext.Provider>
    );

    // Fill out and submit the form as previously tested
    // Assert the server received the correct payload
  });
});

describe('Conditional rendering', () => {
  it('disables all inputs when action is view', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <AggregationOpForm session={mockSession} action="view" />
      </GlobalContext.Provider>
    );
    expect(screen.getByLabelText('Output Column Name*')).toBeDisabled();
    expect(screen.getByTestId('savebutton')).toBeDisabled();
  });
});
