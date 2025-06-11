import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { AirbyteSpec, FieldGroup } from '@/helpers/connectorConfig/types';
import { FormGroup } from '@/helpers/connectorConfig/FormGroup';
import { parseAirbyteSpec } from '@/helpers/connectorConfig/specParser';

interface ConfigFormProps {
  spec: AirbyteSpec;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ spec }) => {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);

  // Parse spec into field groups
  useEffect(() => {
    const groups = parseAirbyteSpec(spec);
    setFieldGroups(groups);
  }, [spec]);

  return (
    <Box>
      {fieldGroups.map((group) => (
        <FormGroup key={group.id} group={group} fieldPathPrefix="config" />
      ))}
    </Box>
  );
};

/**
 * 1. check extractConstValues and parseAirbyteSpec functions.
 */
