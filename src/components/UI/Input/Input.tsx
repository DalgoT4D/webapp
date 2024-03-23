import styled from '@emotion/styled';
import { Box, TextField, InputLabel, TextFieldProps } from '@mui/material';
import { UseFormRegister } from 'react-hook-form';

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    border: '1px solid #758397',
    background: 'white',
    padding: '1px 10px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '6px',
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#97A2B1',
    opacity: 1,
    fontWeight: 600,
  },
  '& .MuiInputBase-input': {
    padding: '8px 10px',
  },
}));

const StyledInputLabel = styled(InputLabel)(() => ({
  color: '#0F2440',
}));

interface InputProps extends Omit<TextFieldProps, 'variant'> {
  register?: UseFormRegister<any>;
  name?: string;
  variant?: 'standard' | 'outlined' | 'filled';
  hookFormValidations?: any;
  fieldStyle?: 'normal' | 'transformation';
}

export const Input: React.FC<InputProps> = ({
  label,
  register,
  name,
  sx,
  required = false,
  hookFormValidations = {},
  fieldStyle = 'normal',
  ...rest
}) => {
  const InputBox = fieldStyle === 'normal' ? TextField : StyledTextField;
  const Label = fieldStyle === 'normal' ? InputLabel : StyledInputLabel;

  const registerValues: any = {
    required: required ? `${label} is required` : false,
  };

  if (rest.type === 'number') {
    registerValues.valueAsNumber = true;
  }
  return (
    <Box sx={sx}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && '*'}
        </Label>
      )}
      {register && name ? (
        <InputBox
          {...register(name, {
            ...registerValues,
            ...hookFormValidations,
          })}
          {...rest}
          id={name}
        />
      ) : (
        <InputBox {...rest} id={name} />
      )}
    </Box>
  );
};

export default Input;
