import Input from '@/components/UI/Input/Input';

import {
  Autocomplete as AutocompleteElement,
  AutocompleteProps as AutocompleteElementProps,
} from '@mui/material';
import { forwardRef } from 'react';

interface AutocompleteProps
  extends Omit<
    AutocompleteElementProps<unknown, boolean, boolean, boolean>,
    'renderInput' | 'onChange'
  > {
  label?: string;
  fieldStyle?: 'normal' | 'transformation' | 'none';
  error?: boolean;
  helperText?: string;
  name?: string;
  onChange: any;
}

export const Autocomplete = forwardRef(function Autocomplete(
  {
    placeholder,
    fieldStyle = 'normal',
    label,
    error,
    helperText,
    name,
    onChange,
    ...rest
  }: AutocompleteProps,
  ref
) {
  return (
    <AutocompleteElement
      {...rest}
      ref={ref}
      id={name}
      onChange={(e, data) => {
        onChange(data);
      }}
      renderInput={(params) => (
        <Input
          {...params}
          name={name}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          label={label}
          fieldStyle={fieldStyle}
        />
      )}
    />
  );
});
