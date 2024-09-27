import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DropColumnOpForm from '../DropColumnOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { intermediateTableResponse, mockNode } from './helpers';

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
    continueOperationChainMock.mockClear();

    await waitFor(() => {
      expect(screen.getByText('Column Name')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('searchDropColBar')).toBeInTheDocument();
    });
    await waitFor(() => {
      const parent = screen.getByTestId('selectAllDropColClick');
      expect(parent).toBeInTheDocument();
      expect(parent.textContent).toBe('SELECT ALL');
    });
    await waitFor(() => {
      const parent = screen.getByTestId('clearAllDropColClick');
      expect(parent).toBeInTheDocument();
      expect(parent.textContent).toBe('CLEAR');
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(dropColumnForm);
    continueOperationChainMock.mockClear();

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      const elements = screen.getAllByText('Please select atleast 1 column');
      expect(elements.length).toBeGreaterThan(1);
    });

    // Get the input element inside the parent element
    const parentElement = screen.getByTestId('checkBoxInputContainer0');
    const inputElement = parentElement.querySelector('input[type="checkbox"]');
    if (inputElement) {
      await fireEvent.click(inputElement);
    }

    await waitFor(() => {
      expect(inputElement).toBeChecked();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});

describe('Form interactions 2', () => {
  it('check select all and clear functionality', async () => {
    render(dropColumnForm);
    continueOperationChainMock.mockClear();

    await waitFor(() => {
      expect(screen.getByText('Column Name')).toBeInTheDocument();
    });

    // Get the input element inside the parent element
    const parentElementAllSelect = screen.getByTestId('selectAllDropColClick');
    const parentElementClearAll = screen.getByTestId('clearAllDropColClick');
    await userEvent.click(parentElementAllSelect);

    // all columns should be checked
    for (let i = 0; i < intermediateTableResponse.length; i++) {
      const parentElement = screen.getByTestId(`checkBoxInputContainer${i}`);
      const inputElement = parentElement.querySelector(
        'input[type="checkbox"]'
      );
      expect(inputElement).toBeChecked();
    }

    // clear all selected
    await userEvent.click(parentElementClearAll);
    for (let i = 0; i < intermediateTableResponse.length; i++) {
      const parentElement = screen.getByTestId(`checkBoxInputContainer${i}`);
      const inputElement = parentElement.querySelector(
        'input[type="checkbox"]'
      );
      expect(inputElement).not.toBeChecked();
    }

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      const elements = screen.getAllByText('Please select atleast 1 column');
      expect(elements.length).toBeGreaterThan(1);
      expect(continueOperationChainMock).not.toHaveBeenCalled();
    });
  });
});

describe('Form interactions 3', () => {
  it('search and select columns', async () => {
    render(dropColumnForm);
    continueOperationChainMock.mockClear();

    await waitFor(() => {
      expect(screen.getByText('Column Name')).toBeInTheDocument();
    });

    // Get the input element inside the parent element
    const searchInputParent = screen.getByTestId('searchDropColBar');
    const searchInput = searchInputParent.querySelector('input[type="text"]');
    expect(searchInput).toBeInTheDocument();
    if (searchInput) await userEvent.type(searchInput, 'District');

    // Select all columns that are filtered by the search
    const parentElementAllSelect = screen.getByTestId('selectAllDropColClick');
    await userEvent.click(parentElementAllSelect);
    for (let i = 0; i < intermediateTableResponse.length; i++) {
      if (
        intermediateTableResponse[i].name.includes('District'.toLowerCase())
      ) {
        const parentElement = screen.getByTestId(`checkBoxInputContainer${i}`);
        const inputElement = parentElement.querySelector(
          'input[type="checkbox"]'
        );
        expect(inputElement).toBeChecked();
      }
    }

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    expect(continueOperationChainMock).toHaveBeenCalled();
  });
});
