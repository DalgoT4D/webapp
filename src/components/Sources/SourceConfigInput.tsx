import { Box, TextField } from '@mui/material';
import React from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';

export interface SourceConfigInputprops {
  specs: Array<any>;
  registerFormFieldValue: (...args: any) => any;
  control: any;
  setFormValue: (...args: any) => any;
}

export const SourceConfigInput = ({
  specs,
  registerFormFieldValue,
  control,
  setFormValue,
}: SourceConfigInputprops) => {
  return (
    <>
      {specs
        ?.sort((input1, input2) => input1.order - input2.order)
        .map((spec: any, idx: number) =>
          spec.type === 'string' ? (
            <React.Fragment key={idx}>
              <TextField
                sx={{ width: '100%' }}
                label={spec?.title}
                variant="outlined"
                {...registerFormFieldValue(`config.${spec.field}`, {
                  required: spec.required,
                })}
                defaultValue={spec?.default}
              ></TextField>
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'array' ? (
            <React.Fragment key={idx}>
              <Controller
                name={`config.${spec.field}`}
                control={control}
                rules={{ required: spec.required }}
                render={({ field: { value, onChange } }) => (
                  <MultiTagInput
                    field={`config.${spec.field}`}
                    label={spec.title}
                    fieldValueArr={value}
                    onFieldChange={onChange}
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
                defaultValue={spec?.default}
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
