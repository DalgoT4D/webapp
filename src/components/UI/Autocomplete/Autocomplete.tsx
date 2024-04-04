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
  register?: any;
  fieldStyle?: 'normal' | 'transformation' | 'none';
  required?: boolean;
  error?: boolean;
  helperText?: string;
  name?: string;
}

export const Autocomplete = ({
  placeholder,
  fieldStyle = 'normal',
  label,
  error,
  register,
  helperText,
  name,
  required = false,
  ...rest
}: AutocompleteProps) => {
  return (
    <AutocompleteElement
      {...rest}
      renderInput={(params) => (
        <Input
          {...params}
          name={name}
          register={register}
          required={required}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          label={label}
          fieldStyle={fieldStyle}
        />
      )}
    />
  );
};
