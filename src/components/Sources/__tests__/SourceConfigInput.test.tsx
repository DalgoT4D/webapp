import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { SourceConfigInput } from '../SourceConfigInput';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

describe('Connections Setup', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a' },
  };

  it('renders the form with a single string field', async () => {
    const registerFormFieldValueMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <SourceConfigInput
          specs={[
            {
              type: 'string',
              airbyte_secret: false,
              title: 'spec-title',
              field: 'specfield',
              required: false,
              default: 'default-value',
            },
          ]}
          registerFormFieldValue={(fieldName, params) =>
            registerFormFieldValueMock(fieldName, params)
          }
          control={() => {}}
          setFormValue={() => {}}
        />
      </SessionProvider>
    );

    const inputField = screen.getByLabelText('spec-title');
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('default-value');
    expect(inputField.type).toBe('text');

    await userEvent.type(inputField, 'new-value');

    expect(registerFormFieldValueMock).toHaveBeenCalledWith(
      'config.specfield',
      {
        required: false,
      }
    );
  });

  it('renders the form with a single required string field', async () => {
    const registerFormFieldValueMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <SourceConfigInput
          specs={[
            {
              type: 'string',
              airbyte_secret: false,
              title: 'spec-title',
              field: 'specfield',
              required: true,
              default: 'default-value',
            },
          ]}
          registerFormFieldValue={(fieldName, params) =>
            registerFormFieldValueMock(fieldName, params)
          }
          control={() => {}}
          setFormValue={() => {}}
        />
      </SessionProvider>
    );

    const inputField = screen.getByLabelText('spec-title*');
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('default-value');
    expect(inputField.type).toBe('text');

    await userEvent.type(inputField, 'new-value');

    expect(registerFormFieldValueMock).toHaveBeenCalledWith(
      'config.specfield',
      {
        required: true,
      }
    );
  });

  it('renders the form with a single integer field', async () => {
    const registerFormFieldValueMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <SourceConfigInput
          specs={[
            {
              type: 'integer',
              airbyte_secret: false,
              title: 'spec-title',
              field: 'specfield',
              required: false,
              default: 99,
            },
          ]}
          registerFormFieldValue={(fieldName, params) =>
            registerFormFieldValueMock(fieldName, params)
          }
          control={() => {}}
          setFormValue={() => {}}
        />
      </SessionProvider>
    );

    const inputField = screen.getByLabelText('spec-title');
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('99');
    expect(inputField.type).toBe('number');

    await userEvent.type(inputField, '20');

    expect(registerFormFieldValueMock).toHaveBeenCalledWith(
      'config.specfield',
      {
        required: false,
      }
    );
  });
});
