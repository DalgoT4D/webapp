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
  required,
  ...rest
}) => {
  return (
    <Box sx={sx}>
      <InputLabel htmlFor={name}>
        {label}
        {required && '*'}
      </InputLabel>
      {register && name ? (
        <TextField
          {...register(name, {
            required,
            valueAsNumber: rest.type === 'number',
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
