import Input from '@/components/UI/Input/Input';

import {
  Autocomplete as AutocompleteElement,
  AutocompleteProps as AutocompleteElementProps,
} from '@mui/material';

interface AutocompleteProps
  extends Omit<
    AutocompleteElementProps<unknown, boolean, boolean, boolean>,
    'renderInput'
  > {
  label?: string;
  fieldStyle?: 'normal' | 'transformation' | 'none';
  required?: boolean;
}

export const Autocomplete = ({
  placeholder,
  fieldStyle = 'normal',
  label,
  required = false,
  ...rest
}: AutocompleteProps) => {
  return (
    <AutocompleteElement
      {...rest}
      renderInput={(params) => (
        <Input
          {...params}
          required={required}
          placeholder={placeholder}
          label={label}
          fieldStyle={fieldStyle}
        />
      )}
    />
  );
};
