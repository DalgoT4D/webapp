import { Box, Chip, Stack, TextFieldProps } from '@mui/material';
import React, { useState } from 'react';
import { Close } from '@mui/icons-material';
import Input from './UI/Input/Input';

export interface MultiTagInput extends Omit<TextFieldProps, 'variant'> {
  field: string;
  label: string;
  fieldValueArr: Array<string>;
  setFormValue: (...args: any) => any;
  disabled: boolean;
}

const MultiTagInput = ({
  field,
  label,
  fieldValueArr,
  setFormValue,
  disabled,
  ...rest
}: MultiTagInput) => {
  const [currentValue, setCurrentValue] = useState<string>('');

  const handleChipClose = (e: any) => {
    const tempArr: any = fieldValueArr || [];
    const updatedTempArr: Array<string> = [].concat(
      tempArr.slice(0, Number(e.target.id)),
      tempArr.slice(Number(e.target.id) + 1, tempArr.length)
    );
    setFormValue(field, updatedTempArr);
  };

  const handleKeyDown = (e: any) => {
    let tempArr = fieldValueArr || [];

    switch (e.key) {
      case 'Enter':
        tempArr.push(currentValue);
        setFormValue(field, tempArr);
        setCurrentValue('');
        break;
      case 'Backspace':
        if (currentValue.length === 0) {
          tempArr = tempArr.slice(0, tempArr.length - 1);
          setFormValue(field, tempArr);
        }
        break;
    }
  };

  return (
    <Box>
      <Input
        label={label}
        multiline
        variant="outlined"
        data-testid={`${field}-multi-tag`}
        id={'0'}
        defaultValue={''}
        name={field}
        placeholder={label}
        sx={{ width: '100%' }}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value.replace('\n', ''))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...rest}
        InputProps={{
          startAdornment: (
            <Stack
              direction="row"
              gap="5px"
              flexWrap="wrap"
              data-testid={`${field}-multi-tag-stack`}
            >
              {fieldValueArr &&
                fieldValueArr.map((ele, idx) => (
                  <Chip
                    disabled={disabled}
                    id={String(idx)}
                    key={idx}
                    label={ele}
                    deleteIcon={<Close />}
                    onDelete={handleChipClose}
                    variant="outlined"
                  />
                ))}
            </Stack>
          ),
        }}
      />
    </Box>
  );
};

export default MultiTagInput;
