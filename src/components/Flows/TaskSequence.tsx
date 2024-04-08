import { ControllerRenderProps } from 'react-hook-form';
import { Autocomplete } from '../UI/Autocomplete/Autocomplete';
import { TransformTask } from '../DBT/DBTTarget';
import { useState, useMemo, useRef } from 'react';
import { DeleteOutlineOutlined } from '@mui/icons-material';

import { Tree } from 'react-arborist';
import { Box } from '@mui/material';

interface TaskSequenceProps {
  field: ControllerRenderProps<any, any>;
  options: TransformTask[];
}

export const TaskSequence = ({
  field,
  options: initialOptions,
}: TaskSequenceProps) => {
  const treeRef = useRef();
  const [selectedOptions, setSelectedOptions] = useState<TransformTask[]>(
    initialOptions
      .filter((option) => option.generated_by === 'system')
      .map((option) => ({ id: option.seq, ...option }))
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState(
    initialOptions
      .filter((option) => option.generated_by !== 'system')
      .map((option) => ({ id: option.seq, ...option }))
  );

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
  const removeNode = (node: any) => {
    const newAutocompleteOptions = [...autocompleteOptions, node.data].sort(
      (a, b) => a.seq - b.seq
    );

    const newSelectedOptions = selectedOptions.filter(
      (option) => option.uuid !== node.data.uuid
    );

    setSelectedOptions(newSelectedOptions);
    setAutocompleteOptions(newAutocompleteOptions);
  };

  function Node({ node, dragHandle }: any) {
    /* This node instance can do many things. See the API reference. */
    return (
      <Box
        ref={dragHandle}
        sx={{
          maxWidth: '500px',
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
          {node.data.command}
        </Box>
        <Box
          sx={{
            p: '4px 12px',
            marginLeft: 'auto',
            width: '80px',
            background: '#33A195',
            color: 'white',
            borderRadius: '0px 6px 6px 0px',
          }}
        >
          {node.data.generated_by}
        </Box>
        <Box
          sx={{ cursor: 'pointer', p: '2px' }}
          onClick={() => removeNode(node)}
        >
          <DeleteOutlineOutlined />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Autocomplete
        inputValue=""
        getOptionLabel={(task: any) => task.command}
        placeholder="Select"
        options={autocompleteOptions}
        onChange={handleSelect}
      />
      <Tree
        ref={treeRef}
        data={selectedOptions}
        idAccessor="uuid"
        onMove={(node) => console.log(node, treeRef.current)}
        disableDrag={(data) => data.generated_by === 'system'}
        width={'100%'}
        indent={32}
        rowHeight={50}
        overscanCount={1}
        paddingTop={30}
        paddingBottom={10}
      >
        {Node}
      </Tree>
    </>
  );
};
