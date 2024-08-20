import { render, screen, waitFor } from '@testing-library/react';
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

const continueOperationChainMock = jest.fn();
const mockContext = {
  Toast: { state: null, dispatch: jest.fn() },
};

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
    label: 'Unpivot',
    slug: 'unpivot',
    infoToolTip: 'Unpivot columns & values of a table into rows',
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
    case url.includes('transform/dbt_project/model/operations/'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          config: {
            source_columns: ['column1', 'column2', 'column3'],
            exclude_columns: ['column1'],
            unpivot_columns: ['column2'],
            unpivot_field_name: 'field_name',
            unpivot_value_name: 'value_name',
            input_models: [{ uuid: 'mock-uuid' }]
          }
        }),
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

    const unpivotColumn1 = screen.getByTestId('unpivotColumn0');
    const unpivotColumn2 = screen.getByTestId('unpivotColumn1');

    await user.click(unpivotColumn1);
    await user.click(unpivotColumn2);

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });



  it('deselects all columns for unpivoting when "Select all" is unchecked', async () => {
    render(unpivotForm);

    const selectAllCheckbox = screen.getAllByText('Select all')[1];
    await user.click(selectAllCheckbox);
    await user.click(selectAllCheckbox);

    const unpivotColumns = screen.getAllByTestId(/unpivotColumn/);
    unpivotColumns.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('resets the form after successful submission', async () => {
    render(unpivotForm);

    const unpivotColumn1 = screen.getAllByTestId('CheckBoxOutlineBlankIcon')[0];
    await user.click(unpivotColumn1);

    const saveButton = screen.getByTestId('savebutton');
    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(unpivotColumn1).not.toBeChecked();
    });
  });

  it('handles API errors gracefully', async () => {
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      })
    );

    render(unpivotForm);

    const saveButton = screen.getByTestId('savebutton');
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Atleast one column required to unpivot')
      ).toBeInTheDocument();
    });
  });

  it('excludes columns correctly', async () => {
    render(unpivotForm);

    const excludeColumn1 = screen.getAllByTestId('CheckBoxOutlineBlankIcon')[0];
    await user.click(excludeColumn1);

    const saveButton = screen.getByTestId('savebutton');
    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(excludeColumn1).not.toBeChecked();
    });
  });
  it('fetches and sets source columns correctly', async () => {
    render(unpivotForm);

    await waitFor(() => {
      const unpivotColumns = screen.getAllByTestId(/unpivotColumn/);
      expect(unpivotColumns.length).toBeGreaterThan(0);
    });
  });


});
