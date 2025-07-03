import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { Tree } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@/assets/icons/datatable.svg';
import DeleteIcon from '@mui/icons-material/Delete';
import { DbtSourceModel, WarehouseTable } from './Canvas';
import AddIcon from '@mui/icons-material/Add';
import useResizeObserver from 'use-resize-observer';
import { trimString } from '@/utils/common';
import Image from 'next/image';
import ReplayIcon from '@mui/icons-material/Replay';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import { SRC_MODEL_NODE } from '../constant';
import { TextField, FormControlLabel, Checkbox } from '@mui/material';

const Node = ({ node, style, dragHandle, handleSyncClick, isSyncing }: any) => {
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const width = node.tree.props.width;
  const { setCanvasAction } = useCanvasAction();

  const stringLengthWithWidth = Math.abs(width / 15);
  /* This node instance can do many things. See the API reference. */
  const data: DbtSourceModel = node.data;
  let name: string | JSX.Element = !node.isLeaf ? data.schema : data.input_name;
  name = trimString(name, stringLengthWithWidth);
  useEffect(() => {
    if (!node.isLeaf && node.level === 0 && !node.isOpen) {
      node.toggle();
    }
  }, [node]);

  return (
    <Box
      style={style}
      ref={dragHandle}
      sx={{
        alignItems: 'center',
        display: 'flex',
        mr: 2,
        width: (250 * width) / 270 + 'px',
        opacity: permissions.includes('can_create_dbt_model') ? 1 : 0.5,
      }}
      onClick={() => (node.isLeaf || node.level === 0 ? undefined : node.toggle())}
    >
      {node.isLeaf ? (
        <Image src={TocIcon} alt="Toc icon" />
      ) : node.isOpen ? (
        <FolderOpenIcon />
      ) : (
        <FolderIcon />
      )}
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Typography sx={{ ml: 1, minWidth: 0, fontWeight: 600 }}>{name}</Typography>
        {node.isLeaf && (
          <Box sx={{ display: 'flex', ml: 'auto', alignItems: 'center' }}>
            <AddIcon sx={{ cursor: 'pointer' }} />
            {node.data?.input_type == 'source' && (
              <DeleteIcon
                sx={{ cursor: 'pointer' }}
                fontSize="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setCanvasAction({
                    type: 'delete-source-tree-node',
                    data: {
                      nodeId: node.id,
                      nodeType: SRC_MODEL_NODE,
                      shouldRefreshGraph: true,
                      isDummy: node.data?.isDummy,
                    },
                  });
                }}
              />
            )}
          </Box>
        )}
        {!node.isLeaf &&
          node.level === 0 &&
          (!isSyncing ? (
            <Tooltip title="Sync Sources">
              <ReplayIcon
                sx={{
                  ml: 'auto',
                  cursor: 'pointer',
                  opacity: permissions.includes('can_sync_sources') ? 1 : 0.5,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  console.log('here clicking the sync button');
                  handleSyncClick();
                }}
              />
            </Tooltip>
          ) : (
            <CircularProgress
              sx={{
                ml: 'auto',
              }}
              size={24}
            />
          ))}
      </Box>
    </Box>
  );
};

interface ProjectTreeProps {
  dbtSourceModels: WarehouseTable[];
  handleNodeClick: (...args: any) => void;
  handleSyncClick: (...args: any) => void;
  isSyncing?: boolean;
}

const ProjectTree = ({
  dbtSourceModels,
  handleNodeClick,
  handleSyncClick,
  isSyncing = false,
}: ProjectTreeProps) => {
  const { ref, width, height } = useResizeObserver();
  const [projectTreeData, setProjectTreeData] = useState<any[]>([]);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const searchTermRef = useRef('');
  const [filterBy, setFilterBy] = useState<'schema' | 'table'>('table');
  const [openByDefault, setOpenByDefault] = useState(false);

  const constructAndSetProjectTreeData = (dbtSourceModels: WarehouseTable[]) => {
    // group by schema and push dbtSourceModels under the children key
    const leafNodesBySchema = dbtSourceModels.reduce(
      (acc, dbtSourceModel) => {
        const schema = dbtSourceModel.schema;
        if (schema in acc) {
          acc[schema].push(dbtSourceModel);
        } else {
          acc[schema] = [dbtSourceModel];
        }
        return acc;
      },
      {} as { [key: string]: WarehouseTable[] }
    );

    // construct the tree data
    const treeData = Object.keys(leafNodesBySchema).map((schema: string, idx: number) => {
      return {
        id: String(idx + 1),
        schema: schema,
        children: leafNodesBySchema[schema],
      };
    });

    if (treeData.length == 0) setProjectTreeData([]);
    else setProjectTreeData([{ id: '0', schema: 'Data', children: treeData }]);

    if (filterBy === 'table' && searchTermRef.current.trim() !== '') {
      setOpenByDefault(true);
    } else {
      setOpenByDefault(false);
    }
  };

  const onSearchValueChange = (searchTerm: string) => {
    searchTerm = searchTerm.trim();
    const filteredData = dbtSourceModels.filter((dbtSourceModel) => {
      if (filterBy === 'schema') {
        return dbtSourceModel.schema.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (filterBy === 'table') {
        return dbtSourceModel.input_name.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
    constructAndSetProjectTreeData(filteredData);
  };

  useEffect(() => {
    if (dbtSourceModels) {
      onSearchValueChange(searchTermRef.current);
    }
  }, [dbtSourceModels, filterBy]);

  return (
    <Box
      sx={{
        height: '100%',
        background: '#F5FAFA',
      }}
    >
      <Box
        sx={{
          height: '44px',
          background: '#F5FAFA',
          border: '1px #CCD6E2 solid',
          borderLeft: 0,
          borderRight: 0,
        }}
      ></Box>
      <Box
        sx={{
          p: '10px',
          pr: 0,
          pb: 0,
          height: 'calc(100% - 44px)',
        }}
        ref={ref}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <TextField
            label={`Search by ${filterBy}`}
            onChange={(e) => {
              searchTermRef.current = e.target.value;
              onSearchValueChange(e.target.value);
            }}
            fullWidth
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox checked={filterBy === 'schema'} onChange={() => setFilterBy('schema')} />
              }
              label="Schema"
            />
            <FormControlLabel
              control={
                <Checkbox checked={filterBy === 'table'} onChange={() => setFilterBy('table')} />
              }
              label="Table"
            />
          </Box>
        </Box>
        {projectTreeData.length > 0 ? (
          <Tree
            childrenAccessor={(d: any) => d.children}
            openByDefault={openByDefault}
            data={projectTreeData}
            height={height}
            width={width}
            rowHeight={30}
            onSelect={permissions.includes('can_create_dbt_model') ? handleNodeClick : undefined}
          >
            {(props) => <Node {...props} handleSyncClick={handleSyncClick} isSyncing={isSyncing} />}
          </Tree>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography>No results found.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProjectTree;
