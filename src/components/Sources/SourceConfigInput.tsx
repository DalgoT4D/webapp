import { Autocomplete, Box, IconButton, InputAdornment } from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import Input from '../UI/Input/Input';

export interface SourceConfigInputprops {
  specs: Array<any>;
  registerFormFieldValue: (...args: any) => any;
  control: any;
  setFormValue: (...args: any) => any;
  unregisterFormField: (...args: any) => any;
  source?: any;
}

export type SourceSpec = {
  type: string;
  const?: unknown;
  field: string;
  title: string;
  default: unknown;
  airbyte_secret: boolean;
  required: boolean;
  enum?: Array<unknown>;
  parent?: string;
  specs?: Array<SourceSpec>;
  order: number;
  pattern?: string;
};

export const SourceConfigInput = ({
  specs,
  registerFormFieldValue,
  control,
  setFormValue,
  unregisterFormField,
  source,
}: SourceConfigInputprops) => {
  const [connectorSpecs, setConnectorSpecs] = useState<Array<SourceSpec>>([]);

  const [showPasswords, setShowPasswords] = useState<any>({});

  const handleClickShowPassword = (field: string) => {
    const tempShowPasswords: any = { ...showPasswords };
    tempShowPasswords[field] = !showPasswords[field];
    setShowPasswords(tempShowPasswords);
  };

  const handleObjectFieldOnChange = (
    dropDownVal: string,
    field: string,
    fieldOnChangeFunc: any
  ) => {
    fieldOnChangeFunc.onChange(dropDownVal);

    // Fetch the current selected spec of type object based on selection
    const selectedSpec: SourceSpec | undefined = connectorSpecs.find(
      (ele: SourceSpec) => ele.field === field
    );

    // Filter all specs that are under selectedSpec and have parent as selectedSpec
    // Check if any child specs has type object
    const filteredChildSpecs: Array<SourceSpec> = [];
    if (selectedSpec && selectedSpec.specs) {
      selectedSpec.specs.forEach((ele: SourceSpec) => {
        if (ele.parent === dropDownVal) {
          // Check if the child has another level or not
          if (ele.specs && ele.enum && ele.enum.length === 0) {
            ele.specs.forEach((childEle: SourceSpec) => {
              filteredChildSpecs.push({ ...childEle, order: ele.order });
            });
          } else {
            filteredChildSpecs.push(ele);
          }
        }
      });
    }

    // Set the order of child specs to be displayed at correct position
    filteredChildSpecs.forEach((ele: SourceSpec) => {
      ele.order = selectedSpec?.order || -1;
    });

    // Find the specs that will have parent in the following enum array
    const enumsToRemove =
      (selectedSpec &&
        selectedSpec.enum &&
        selectedSpec.enum.filter((ele) => ele !== dropDownVal)) ||
      [];

    const tempSpecs = connectorSpecs
      .filter(
        (sp: SourceSpec) => !sp.parent || !enumsToRemove.includes(sp.parent)
      )
      .concat(filteredChildSpecs);

    // Unregister the form fields that have parent in enumsToRemove
    connectorSpecs.forEach((sp: SourceSpec) => {
      if (sp.parent && enumsToRemove.includes(sp.parent))
        unregisterFormField(sp.field);
    });

    setConnectorSpecs(tempSpecs);
  };

  useEffect(() => {
    setConnectorSpecs(specs);
  }, [specs]);

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
      {connectorSpecs
        ?.sort((input1, input2) => input1.order - input2.order)
        .map((spec: SourceSpec, idx: number) =>
          spec?.type === 'string' ? (
            spec.airbyte_secret ? (
              <React.Fragment key={idx}>
                <Input
                  sx={{ width: '100%' }}
                  label={spec?.title}
                  register={registerFormFieldValue}
                  name={spec.field}
                  variant="outlined"
                  type={showPasswords[`${spec.field}`] ? 'text' : 'password'}
                  required={spec.required}
                  defaultValue={spec?.default}
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
                ></Input>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : (
              <React.Fragment key={idx}>
                <Input
                  sx={{ width: '100%' }}
                  label={spec?.title}
                  variant="outlined"
                  register={registerFormFieldValue}
                  name={spec.field}
                  required={spec.required}
                  defaultValue={spec?.default}
                  disabled={source ? true : false}
                  inputProps={{ pattern: spec?.pattern }}
                ></Input>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            )
          ) : spec?.type === 'array' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                render={({ field: { value } }) => (
                  <MultiTagInput
                    disabled={source && !spec.airbyte_secret ? true : false}
                    field={spec.field}
                    label={spec.title}
                    fieldValueArr={value}
                    setFormValue={setFormValue}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec?.type === 'integer' ? (
            <React.Fragment key={idx}>
              <Input
                disabled={source && !spec.airbyte_secret ? true : false}
                sx={{ width: '100%' }}
                label={spec?.title}
                variant="outlined"
                register={registerFormFieldValue}
                name={spec.field}
                required={spec.required}
                defaultValue={spec?.default}
                type="number"
              ></Input>
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec?.type === 'object' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={source ? true : false}
                    data-testid="autocomplete"
                    id={spec.field}
                    value={field.value}
                    options={spec.enum as any}
                    onChange={(e, data: any) => {
                      handleObjectFieldOnChange(data, spec.field, field);
                    }}
                    renderInput={(params) => (
                      <Input
                        name={spec.field}
                        {...params}
                        variant="outlined"
                        label={spec.title}
                      />
                    )}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : (
            ''
          )
        )}
    </>
  );
};
