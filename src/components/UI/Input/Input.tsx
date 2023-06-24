import { Box, TextField, InputLabel, TextFieldProps } from '@mui/material';
import { UseFormRegister } from 'react-hook-form';

interface InputProps extends Omit<TextFieldProps, 'variant'> {
  register?: UseFormRegister<any>;
  name?: string;
  variant?: 'standard' | 'outlined' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  register,
  name,
  sx,
  required = false,
  ...rest
}) => {
  const registerValues: any = { required };

  if (rest.type === 'number') {
    registerValues.valueAsNumber = true;
  }
  return (
    <Box sx={sx}>
      <InputLabel htmlFor={name}>
        {label}
        {required && '*'}
      </InputLabel>
      {register && name ? (
        <TextField
          {...register(name, {
            ...registerValues,
          })}
          {...rest}
          id={name}
        />
      ) : (
        <TextField {...rest} id={name} />
      )}
    </Box>
  );
};

export default Input;
