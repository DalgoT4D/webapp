import { ControllerRenderProps } from 'react-hook-form';
import { Autocomplete } from '../UI/Autocomplete/Autocomplete';
import { TransformTask } from '../DBT/DBTTarget';
import { useState, useMemo } from 'react';

import { Tree } from 'react-arborist';
import { Box } from '@mui/material';

interface TaskSequenceProps {
  field: ControllerRenderProps<any, any>;
  options: TransformTask[];
}

function Node({ node, dragHandle }: any) {
  console.log(node);
  /* This node instance can do many things. See the API reference. */
  return (
    <Box
      ref={dragHandle}
      sx={{
        display: 'flex',
        borderRadius: '6px',
        overflow: 'hidden',
        fontWeight: 600,
      }}
    >
      <Box
        sx={{
          p: '4px 12px',
          width: '30px',
          background: '#33A195',
          color: 'white',
        }}
      >
        {node.rowIndex + 1}
      </Box>
      <Box sx={{ p: '4px 12px', background: '#F5FAFA', width: '100%' }}>
        {' '}
        {node.data.name}
      </Box>
      <Box
        sx={{
          p: '4px 12px',
          marginLeft: 'auto',
          width: '80px',
          background: '#33A195',
          color: 'white',
        }}
      >
        {node.data.type}
      </Box>
    </Box>
  );
}

export const TaskSequence = ({
  field,
  options: initialOptions,
}: TaskSequenceProps) => {
  const [selectedOptions, setSelectedOptions] = useState<TransformTask[]>([]);
  const [autocompleteOptions, setAutocompleteOptions] =
    useState(initialOptions);

  const handleSelect = (event, value) => {
    if (value) {
      const newSelectedOptions = [...selectedOptions, value].sort(
        (a, b) => a.seq - b.seq
      );
      const newAutocompleteOptions = autocompleteOptions.filter(
        (option) => option !== value
      );
      setSelectedOptions(newSelectedOptions);
      setAutocompleteOptions(newAutocompleteOptions);
    }
  };

  const data = useMemo(
    () =>
      selectedOptions.map((option) => ({
        id: option.uuid,
        name: option.label,
        type: option.generated_by,
      })),
    [selectedOptions]
  );

  return (
    <>
      <Autocomplete
        inputValue=""
        placeholder="Select"
        options={autocompleteOptions}
        onChange={handleSelect}
      />
      <Tree
        data={data}
        openByDefault={false}
        width={'100%'}
        indent={32}
        rowHeight={36}
        overscanCount={1}
        paddingTop={30}
        paddingBottom={10}
      >
        {Node}
      </Tree>
    </>
  );
};
