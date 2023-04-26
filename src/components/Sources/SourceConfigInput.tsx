import { Box, TextField } from '@mui/material';
import React from 'react';

export interface SourceConfigInputprops {
  specs: Array<any>;
  registerFormFieldValue: Function;
}

export const SourceConfigInput = ({
  specs,
  registerFormFieldValue,
}: SourceConfigInputprops) => {
  return (
    <>
      {specs?.map((spec: any, idx: number) =>
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
        ) : (
          ''
        )
      )}
    </>
  );
};
