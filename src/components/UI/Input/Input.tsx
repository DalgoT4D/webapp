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
  'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
    '-webkit-appearance': 'none',
    margin: 0,
  },
  'input[type=number]': {
    '-moz-appearance': 'textfield',
  },
}));

const NoStyleTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    border: 'unset',
    background: 'white',
    padding: '1px 1px',
    fontSize: '14px',
    fontWeight: 600,
  },
  '& .MuiInputBase-input': {
    padding: '8px 0px',
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
  fieldStyle?: 'normal' | 'transformation' | 'none';
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
  let InputBox, Label;
  switch (fieldStyle) {
    case 'normal':
      InputBox = TextField;
      Label = InputLabel;
      break;
    case 'transformation':
      InputBox = StyledTextField;
      Label = StyledInputLabel;
      break;
    case 'none':
      InputBox = NoStyleTextField;
      Label = InputLabel;
      break;
    default:
      InputBox = TextField;
      Label = InputLabel;
  }

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
          InputProps={{
            inputProps: { step: 'any' },
          }}
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
