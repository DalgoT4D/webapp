import { render, screen, fireEvent, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import {
  DestinationConfigInput,
  DestinationSpec,
} from '../DestinationConfigInput';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import { useForm } from 'react-hook-form';
// import userEvent from '@testing-library/user-event';

const FormContainer = ({ mockSession, specs }: any) => {
  const { control } = useForm({
    defaultValues: {
      constfield: '',
      password: '',
    },
  });
  return (
    <SessionProvider session={mockSession}>
      <DestinationConfigInput
        specs={specs}
        registerFormFieldValue={() => {}}
        control={control}
        setFormValue={() => {}}
        unregisterFormField={() => {}}
      />
    </SessionProvider>
  );
};

describe('DestinationConfigInput', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  // Mock fetch to handle useEffect in components
  beforeEach(() => {
    const fakeResponse = {};
    const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
    const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
    (global as any).fetch = mockedFetch;
  });
  afterEach(() => {
    const fakeResponse = {};
    const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
    const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
    (global as any).fetch = mockedFetch;
  });

  // Tests
  it('renders the form', async () => {
    const specs: Array<DestinationSpec> = [
      {
        type: 'string',
        const: 'constvalue',
        field: 'constfield',
        title: 'Const Field',
        default: '',
        airbyte_secret: false,
        required: true,
        order: 1,
      } as DestinationSpec,
      {
        type: 'string',
        const: undefined,
        field: 'password',
        title: 'Password',
        default: '',
        airbyte_secret: true,
        required: true,
        order: 2,
      } as DestinationSpec,
      {
        type: 'string',
        const: undefined,
        field: 'multiple',
        title: 'MultipleHosts',
        enum: ['host1', 'host2'],
        default: '',
        airbyte_secret: false,
        required: true,
        order: 3,
      } as DestinationSpec,
      {
        type: 'string',
        const: undefined,
        field: 'stringfield',
        title: 'StringField',
        default: 'default-string-value',
        airbyte_secret: false,
        required: true,
        order: 4,
      } as DestinationSpec,
      {
        type: 'boolean',
        const: undefined,
        field: 'booleanfield',
        title: 'BooleanField',
        default: '',
        airbyte_secret: false,
        required: true,
        order: 5,
      } as DestinationSpec,
      // {
      //   type: 'array',
      //   const: undefined,
      //   field: 'arrayfield',
      //   title: 'ArrayField',
      //   default: undefined,
      //   airbyte_secret: false,
      //   required: true,
      //   order: 6,
      // } as DestinationSpec,
      {
        type: 'integer',
        const: undefined,
        field: 'integerfield',
        title: 'IntegerField',
        default: 0,
        airbyte_secret: false,
        required: true,
        order: 7,
      } as DestinationSpec,
      {
        type: 'object',
        const: undefined,
        field: 'objectfield',
        title: 'ObjectField',
        default: undefined,
        enum: [{ key1: 'value1', key2: 'value2' }],
        airbyte_secret: false,
        required: false,
        order: 8,
      } as DestinationSpec,
    ];

    // need a form container because we need a real "control" prop
    render(<FormContainer mockSession={mockSession} specs={specs} />);

    const spec1 = screen.getByLabelText('constvalue');
    expect(spec1).toBeInTheDocument();
    const spec2 = screen.getByLabelText('Password');
    expect(spec2).toBeInTheDocument();
    const spec3 = screen.getByLabelText('MultipleHosts');
    expect(spec3).toBeInTheDocument();
    const spec4 = screen.getByLabelText('StringField');
    expect(spec4).toBeInTheDocument();
    const spec5 = screen.getByText('BooleanField');
    expect(spec5).toBeInTheDocument();
    // TODO spec6
    const spec7 = screen.getByLabelText('IntegerField');
    expect(spec7).toBeInTheDocument();
    const spec8 = screen.getByLabelText('ObjectField');
    expect(spec8).toBeInTheDocument();
  });

  it('modifies a field', async () => {
    const specs: Array<DestinationSpec> = [
      {
        type: 'object',
        field: 'parentfield',
        title: 'ParentField',
        enum: ['option1', 'option2'],
        airbyte_secret: false,
        required: true,
        order: 1,
        specs: [
          {
            type: 'string',
            field: 'child1',
            title: 'Child1',
            airbyte_secret: false,
            required: true,
            order: 2,
            parent: 'option1',
          } as DestinationSpec,
          {
            type: 'string',
            field: 'child2',
            title: 'Child2',
            airbyte_secret: false,
            required: true,
            order: 2,
            parent: 'option2',
          } as DestinationSpec,
        ],
      } as DestinationSpec,
    ];

    // need a form container because we need a real "control" prop
    render(<FormContainer mockSession={mockSession} specs={specs} />);
    const parent = screen.getByLabelText('ParentField');
    expect(parent).toBeInTheDocument();

    const child1 = screen.queryByLabelText('Child1');
    expect(child1).toBeNull();
    const child2 = screen.queryByLabelText('Child2');
    expect(child2).toBeNull();

    const autocomplete = screen.getByTestId('autocomplete');
    await fireEvent.change(parent, {
      target: { value: 'option1' },
    });
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(autocomplete, { key: 'Enter' }));

    const child1after = screen.queryByLabelText('Child1');
    // now Child1 is visible
    expect(child1after).not.toBeNull();
    const child2after = screen.queryByLabelText('Child2');
    expect(child2after).toBeNull();
  });
});
