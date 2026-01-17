import Input from '@/components/UI/Input/Input';
import {
  Autocomplete as AutocompleteElement,
  AutocompleteProps as AutocompleteElementProps,
  Popper,
  styled,
} from '@mui/material';
import { forwardRef } from 'react';

const CustomPopper = styled(Popper)({
  '.MuiAutocomplete-paper': {
    width: 'auto',
    minWidth: '100%',
    overflowX: 'auto',
  },
  '.MuiAutocomplete-listbox': {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    minWidth: '100%',
  },
});

interface AutocompleteProps
  extends Omit<
    AutocompleteElementProps<unknown, boolean, boolean, boolean>,
    'renderInput' | 'onChange'
  > {
  label?: string | JSX.Element;
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
      PopperComponent={(props) => <CustomPopper {...props} />}
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
