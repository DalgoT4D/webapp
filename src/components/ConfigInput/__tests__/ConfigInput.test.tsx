import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfigInput } from '../ConfigInput';
import { useForm } from 'react-hook-form';

// Mock implementation for ConnectorConfigInput.fetchUpdatedSpecsOnObjectFieldChange
jest.mock('../../../helpers/ConnectorConfigInput', () => ({
  fetchUpdatedSpecsOnObjectFieldChange: jest
    .fn()
    .mockImplementation((val, field, specs) => specs),
}));

// Helper component to render ConfigInput with useForm
const ConfigInputTestWrapper = ({ specs }) => {
  const { control, setValue } = useForm();
  return (
    <ConfigInput specs={specs} control={control} setFormValue={setValue} />
  );
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
});
