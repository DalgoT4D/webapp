import { render, screen, waitFor } from '@testing-library/react';
import DropColumnOpForm from '../DropColumnOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { intermediateTableResponse, mockNode } from './helpers';
import { fireMultipleKeyDown } from '@/utils/tests';

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
    label: 'Drop',
    slug: 'dropcolumns',
    infoToolTip:
      'Select the columns that you would like to remove from the table',
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

const dropColumnForm = (
  <GlobalContext.Provider value={mockContext}>
    <DropColumnOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Drop column form', () => {
  it('renders correct initial form state', async () => {
    render(dropColumnForm);
    await waitFor(() => {
      expect(screen.getByText('Select Column to Drop')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(dropColumnForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(
        screen.getByText('Please select atleast 1 column')
      ).toBeInTheDocument();
    });

    await fireMultipleKeyDown('dropColumn', 2);
    await user.click(screen.getByTestId('ArrowDropDownIcon'));

    await waitFor(() => {
      expect(screen.getByText('_airbyte_extracted_at')).toBeInTheDocument();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
