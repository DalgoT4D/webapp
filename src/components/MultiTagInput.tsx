import { Box, Chip, Stack, TextField } from '@mui/material';
import React, { useState } from 'react';
import { Close } from '@mui/icons-material';

export interface MultiTagInput {
  field: string;
  label: string;
  fieldValueArr: Array<string>;
  setFormValue: (...args: any) => any;
}

const MultiTagInput = ({
  field,
  label,
  fieldValueArr,
  setFormValue,
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
      <TextField
        multiline
        variant="outlined"
        id={'0'}
        defaultValue={''}
        name={field}
        placeholder={label}
        sx={{ width: '100%' }}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <Stack direction="row" gap="5px" flexWrap="wrap">
              {fieldValueArr &&
                fieldValueArr.map((ele, idx) => (
                  <Chip
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
