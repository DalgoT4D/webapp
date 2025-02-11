import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfigInput } from '../ConfigInput';
import { useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

// Mock implementation for ConnectorConfigInput.fetchUpdatedSpecsOnObjectFieldChange
jest.mock('../../../helpers/ConnectorConfigInput', () => ({
  fetchUpdatedSpecsOnObjectFieldChange: jest.fn().mockImplementation((val, field, specs) => specs),
}));

// Helper component to render ConfigInput with useForm
const ConfigInputTestWrapper = ({ specs }: { specs: any[] }) => {
  const { control, setValue } = useForm();
  return <ConfigInput specs={specs} control={control} setFormValue={setValue} />;
};

describe('ConfigInput Component', () => {
  const specs = [
    { type: 'string', field: 'name', title: 'Name', required: true, order: 1 },
    {
      type: 'string',
      field: 'password',
      title: 'Password',
      airbyte_secret: true,
      required: true,
      order: 2,
    },
    { type: 'array', field: 'tags', title: 'Tags', required: false, order: 3 },
    { type: 'integer', field: 'age', title: 'Age', required: true, order: 4 },
    {
      type: 'object',
      field: 'country',
      title: 'Country',
      enum: ['USA', 'Canada'],
      required: true,
      order: 5,
    },
  ];

  // Add new test specs
  const enumSpecs = [
    {
      type: 'string', // MongoDB connector case where type is string with enum
      field: 'authType',
      title: 'Authentication Type',
      enum: ['None', 'Password', 'Certificate'],
      required: true,
      order: 1,
    },
  ];

  const booleanSpecs = [
    {
      type: 'boolean',
      field: 'enabled',
      title: 'Enable Feature',
      required: true,
      order: 1,
    },
  ];

  it('renders without crashing', () => {
    render(<ConfigInputTestWrapper specs={specs} />);
  });

  it('renders string input field', () => {
    render(<ConfigInputTestWrapper specs={specs} />);
    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('renders integer input field', () => {
    render(<ConfigInputTestWrapper specs={specs} />);
    const ageInput = screen.getByLabelText(/Age/i);
    expect(ageInput).toBeInTheDocument();
    expect(ageInput).toHaveAttribute('type', 'number');
  });

  it('renders object input field with Autocomplete', () => {
    render(<ConfigInputTestWrapper specs={specs} />);
    const countryInput = screen.getByLabelText(/Country/i);
    expect(countryInput).toBeInTheDocument();
  });

  describe('Enum Field Tests', () => {
    it('renders Autocomplete for string type with enum values', () => {
      render(<ConfigInputTestWrapper specs={enumSpecs} />);

      const authInput = screen.getByLabelText(/Authentication Type/i);
      expect(authInput).toBeInTheDocument();

      const autocomplete = screen.getByTestId('autocomplete');
      expect(autocomplete).toBeInTheDocument();
    });

    it('renders Autocomplete for object type with enum values', () => {
      const objectEnumSpec = [
        {
          type: 'object',
          field: 'country',
          title: 'Country',
          enum: ['USA', 'Canada'],
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={objectEnumSpec} />);

      const countryInput = screen.getByLabelText(/Country/i);
      expect(countryInput).toBeInTheDocument();

      const autocomplete = screen.getByTestId('autocomplete');
      expect(autocomplete).toBeInTheDocument();
    });
  });

  describe('Boolean Field Tests', () => {
    it('renders boolean input field as Switch', () => {
      render(<ConfigInputTestWrapper specs={booleanSpecs} />);

      const switchInput = screen.getByRole('checkbox', { name: /Enable Feature/i });
      expect(switchInput).toBeInTheDocument();
    });

    it('handles required validation for boolean fields', () => {
      render(<ConfigInputTestWrapper specs={booleanSpecs} />);

      const switchLabel = screen.getByText(/Enable Feature\*/i);
      expect(switchLabel).toBeInTheDocument();
    });
  });

  describe('Special Field Types', () => {
    it('renders password field with airbyte_secret flag', () => {
      const secretSpecs = [
        {
          type: 'string',
          field: 'api_key',
          title: 'API Key',
          airbyte_secret: true,
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={secretSpecs} />);
      const passwordInput = screen.getByLabelText(/API Key/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('renders object with oneOf condition', () => {
      const oneOfSpecs = [
        {
          type: 'object',
          field: 'auth_method',
          title: 'Authentication Method',
          required: true,
          order: 1,
          oneOf: [
            {
              title: 'OAuth',
              required: ['client_id', 'client_secret'],
              properties: {
                auth_type: { const: 'oauth2.0' },
                client_id: { type: 'string', title: 'Client ID' },
                client_secret: { type: 'string', title: 'Client Secret' },
              },
            },
            {
              title: 'API Key',
              required: ['api_key'],
              properties: {
                auth_type: { const: 'api_key' },
                api_key: { type: 'string', title: 'API Key' },
              },
            },
          ],
        },
      ];

      render(<ConfigInputTestWrapper specs={oneOfSpecs} />);
      const authMethodInput = screen.getByLabelText(/Authentication Method/i);
      expect(authMethodInput).toBeInTheDocument();
    });
  });

  describe('Validation and Error Handling', () => {
    it('shows required field indicator for required fields', () => {
      render(<ConfigInputTestWrapper specs={specs} />);
      const requiredLabel = screen.getByText(/Name\*/i);
      expect(requiredLabel).toBeInTheDocument();
    });

    it('handles null/undefined specs gracefully', () => {
      const nullSpecs = [
        {
          type: 'string',
          field: 'test',
          title: 'Test',
          required: true,
          specs: null,
        },
      ];

      render(<ConfigInputTestWrapper specs={nullSpecs} />);
      const testInput = screen.getByLabelText(/Test/i);
      expect(testInput).toBeInTheDocument();
    });
  });

  describe('Complex Object Handling', () => {
    it('handles nested object with both enum and specs', () => {
      const complexSpecs = [
        {
          type: 'object',
          field: 'complex',
          title: 'Complex Object',
          enum: ['Option1', 'Option2'],
          specs: [
            {
              type: 'string',
              field: 'sub_field',
              title: 'Sub Field',
              required: true,
            },
          ],
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={complexSpecs} />);
      const complexInput = screen.getByLabelText(/Complex Object/i);
      expect(complexInput).toBeInTheDocument();
    });
  });

  describe('String Type Input Fields', () => {
    it('renders password field with show/hide functionality', async () => {
      const secretSpecs = [
        {
          type: 'string',
          field: 'password',
          title: 'Password',
          airbyte_secret: true,
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={secretSpecs} />);

      // Initially password should be hidden
      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click show password button
      const showPasswordButton = screen.getByRole('button');
      await act(async () => {
        await userEvent.click(showPasswordButton);
      });

      // Password should now be visible
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('renders string field with enum values as Autocomplete', () => {
      const enumStringSpecs = [
        {
          type: 'string',
          field: 'connection_type',
          title: 'Connection Type',
          enum: ['Standard', 'Premium', 'Enterprise'],
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={enumStringSpecs} />);

      const autocomplete = screen.getByTestId('autocomplete');
      expect(autocomplete).toBeInTheDocument();
    });

    it('handles string field with multiline property', () => {
      const multilineSpecs = [
        {
          type: 'string',
          field: 'description',
          title: 'Description',
          multiline: true,
          required: false,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={multilineSpecs} />);

      const textArea = screen.getByLabelText(/Description/i);
      expect(textArea).toHaveAttribute('rows', '4');
    });

    it('handles string field with pattern validation', () => {
      const patternSpecs = [
        {
          type: 'string',
          field: 'email',
          title: 'Email',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={patternSpecs} />);

      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toHaveAttribute('pattern', patternSpecs[0].pattern);
    });
  });

  describe('Enum Field Change Handling', () => {
    it('calls handleObjectFieldOnChange when enum value changes', async () => {
      const mockSetFormValue = jest.fn();
      const enumSpecs = [
        {
          type: 'string',
          field: 'database_type',
          title: 'Database Type',
          enum: ['MySQL', 'PostgreSQL'],
          required: true,
          order: 1,
        },
      ];

      render(<ConfigInputTestWrapper specs={enumSpecs} />);

      // Get the autocomplete input
      const autocomplete = screen.getByTestId('autocomplete');
      expect(autocomplete).toBeInTheDocument();

      // Click to open dropdown
      const input = screen.getByRole('combobox');
      await act(async () => {
        await userEvent.click(input);
      });

      // Select an option
      const option = screen.getByText('MySQL');
      await act(async () => {
        await userEvent.click(option);
      });

      // Verify that fetchUpdatedSpecsOnObjectFieldChange was called
      const { fetchUpdatedSpecsOnObjectFieldChange } = jest.requireMock(
        '../../../helpers/ConnectorConfigInput'
      );
      expect(fetchUpdatedSpecsOnObjectFieldChange).toHaveBeenCalled();
    });
  });

  describe('Password Visibility State', () => {
    it('maintains separate visibility states for multiple password fields', async () => {
      const multipleSecretSpecs = [
        {
          type: 'string',
          field: 'password1',
          title: 'Password 1',
          airbyte_secret: true,
          required: true,
          order: 1,
        },
        {
          type: 'string',
          field: 'password2',
          title: 'Password 2',
          airbyte_secret: true,
          required: true,
          order: 2,
        },
      ];

      render(<ConfigInputTestWrapper specs={multipleSecretSpecs} />);

      const password1Input = screen.getByLabelText(/Password 1/i);
      const password2Input = screen.getByLabelText(/Password 2/i);
      const showPasswordButtons = screen.getAllByRole('button');

      // Initially both should be hidden
      expect(password1Input).toHaveAttribute('type', 'password');
      expect(password2Input).toHaveAttribute('type', 'password');

      // Show first password
      await act(async () => {
        await userEvent.click(showPasswordButtons[0]);
      });

      // First password should be visible, second still hidden
      expect(password1Input).toHaveAttribute('type', 'text');
      expect(password2Input).toHaveAttribute('type', 'password');
    });
  });
});
