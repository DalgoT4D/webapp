import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { SourceConfigInput } from '../SourceConfigInput';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useForm } from 'react-hook-form';

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

  const ConfigInput = ({ specs }: any) => {
    const { control, setValue } = useForm<any>({
      defaultValues: {
        name: '',
        sourceDef: null,
        config: {},
      },
    });

    // setting default value
    specs.forEach((spec: any) => setValue(spec.field, spec.default));

    return (
      <SessionProvider session={mockSession}>
        <SourceConfigInput
          specs={specs}
          control={control}
          setFormValue={setValue}
          lastRenderedSpecRef={null}
        />
      </SessionProvider>
    );
  };

  const stringSpecs = [
    {
      type: 'string',
      airbyte_secret: false,
      title: 'spec-title',
      field: 'specfield',
      required: false,
      default: 'default-value',
    },
  ];

  it('renders the form with a single string field', async () => {
    render(<ConfigInput specs={stringSpecs} />);

    const inputField = screen.getByLabelText('spec-title') as HTMLInputElement;
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('default-value');
    expect(inputField.type).toBe('text');

    await userEvent.type(inputField, 'new-value');
  });

  it('renders the form with a single required string field', async () => {
    const stringRequiredSpecs = [{ ...stringSpecs[0], required: true }];
    render(<ConfigInput specs={stringRequiredSpecs} />);

    const inputField = screen.getByLabelText('spec-title*') as HTMLInputElement;
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('default-value');
    expect(inputField.type).toBe('text');

    await userEvent.type(inputField, 'new-value');
  });

  it('renders the form with a single integer field', async () => {
    const integerSpecs = [
      {
        type: 'integer',
        airbyte_secret: false,
        title: 'spec-title',
        field: 'specfield',
        required: false,
        default: 99,
      },
    ];
    render(<ConfigInput specs={integerSpecs} />);

    const inputField = screen.getByLabelText('spec-title') as HTMLInputElement;
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('99');
    expect(inputField.type).toBe('number');

    await userEvent.type(inputField, '20');
  });
});
