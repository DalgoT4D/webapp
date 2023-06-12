import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

export interface SourceConfigInputprops {
  specs: Array<any>;
  registerFormFieldValue: (...args: any) => any;
  control: any;
  setFormValue: (...args: any) => any;
  source?: any;
}

export const SourceConfigInput = ({
  specs,
  registerFormFieldValue,
  control,
  setFormValue,
}: SourceConfigInputprops) => {
  const [showPasswords, setShowPasswords] = useState<any>({});

  const handleClickShowPassword = (field: string) => {
    const tempShowPasswords: any = { ...showPasswords };
    tempShowPasswords[field] = !showPasswords[field];
    setShowPasswords(tempShowPasswords);
  };

  useEffect(() => {
    const tempShowPasswords: any = {};
    specs.forEach((element) => {
      if (element?.airbyte_secret) {
        tempShowPasswords[element.field] = false;
      }
    });
    setShowPasswords(tempShowPasswords);
  }, [specs]);

  return (
    <>
      {specs
        ?.sort((input1, input2) => input1.order - input2.order)
        .map((spec: any, idx: number) =>
          spec.type === 'string' ? (
            spec.airbyte_secret ? (
              <React.Fragment key={idx}>
                <TextField
                  sx={{ width: '100%' }}
                  label={spec?.title}
                  variant="outlined"
                  type={showPasswords[`${spec.field}`] ? 'text' : 'password'}
                  {...registerFormFieldValue(`config.${spec.field}`, {
                    required: spec.required,
                  })}
                  value={spec?.default}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box>
                          <IconButton
                            onClick={() =>
                              handleClickShowPassword(`${spec.field}`)
                            }
                            edge="end"
                          >
                            {showPasswords[`${spec.field}`] ? (
                              <VisibilityOutlinedIcon />
                            ) : (
                              <VisibilityOffOutlinedIcon />
                            )}
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                ></TextField>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : (
              <React.Fragment key={idx}>
                <TextField
                  sx={{ width: '100%' }}
                  label={spec?.title}
                  variant="outlined"
                  {...registerFormFieldValue(`config.${spec.field}`, {
                    required: spec.required,
                  })}
                  value={spec?.default}
                ></TextField>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            )
          ) : spec.type === 'array' ? (
            <React.Fragment key={idx}>
              <Controller
                name={`config.${spec.field}`}
                control={control}
                rules={{ required: spec.required }}
                render={({ field: { value } }) => (
                  <MultiTagInput
                    field={`config.${spec.field}`}
                    label={spec.title}
                    fieldValueArr={value}
                    setFormValue={setFormValue}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'integer' ? (
            <React.Fragment key={idx}>
              <TextField
                sx={{ width: '100%' }}
                label={spec?.title}
                variant="outlined"
                {...registerFormFieldValue(`config.${spec.field}`, {
                  required: spec.required,
                  valueAsNumber: true,
                })}
                value={spec?.default}
                type="number"
              ></TextField>
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : (
            ''
          )
        )}
    </>
  );
};
