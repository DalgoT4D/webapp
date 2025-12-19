import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { Tree } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@/assets/icons/datatable.svg';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import useResizeObserver from 'use-resize-observer';
import Image from 'next/image';
import ReplayIcon from '@mui/icons-material/Replay';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import { TextField, FormControlLabel, Checkbox } from '@mui/material';
import { DbtModelResponse } from '@/types/transform-v2.types';

const Node = ({ node, style, dragHandle, handleSyncClick, isSyncing, included_in }: any) => {
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const width = node.tree.props.width;
  const { setCanvasAction } = useCanvasAction();

  /* This node instance can do many things. See the API reference. */
  const data: DbtModelResponse = node.data;
  const name = !node.isLeaf ? data.schema : data.name;

  // Check if this is the Data folder and it's empty
  const isEmptyDataFolder =
    !node.isLeaf && node.level === 0 && (!node.children || node.children.length === 0);

  useEffect(() => {
    if (!node.isLeaf && node.level === 0 && !node.isOpen) {
      node.toggle();
    }
  }, [node]);

  return (
    <>
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '24px',
            justifyContent: 'center',
          }}
        >
          {node.isLeaf ? (
            <Image src={TocIcon} alt="Toc icon" style={{ width: '18px', height: '18px' }} />
          ) : node.isOpen ? (
            <FolderOpenIcon sx={{ fontSize: '20px' }} />
          ) : (
            <FolderIcon sx={{ fontSize: '20px' }} />
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            width: 'calc(100% - 24px)',
            alignItems: 'center',
            minWidth: 0,
          }}
        >
          <Tooltip title={name}>
            <Typography
              sx={{
                ml: 0.5,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {name}
            </Typography>
          </Tooltip>
          {node.isLeaf && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                ml: 1,
                flexShrink: 0,
              }}
            >
              <Tooltip title="Add to canvas">
                <AddIcon
                  sx={{
                    cursor: 'pointer',
                    fontSize: '20px',
                    '&:hover': { opacity: 0.7 },
                  }}
                />
              </Tooltip>
              {included_in !== 'explore' && (
                <Tooltip title="Delete source">
                  <DeleteIcon
                    sx={{
                      cursor: 'pointer',
                      fontSize: '20px',
                      '&:hover': { opacity: 0.7 },
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCanvasAction({
                        type: 'delete-source-tree-node',
                        data: {
                          nodeId: node.id,
                          nodeType: node.data?.type,
                          shouldRefreshGraph: true,
                          isDummy: node.data?.isDummy,
                        },
                      });
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          )}
          {!node.isLeaf && node.level === 0 && (
            <Box
              sx={{
                ml: 'auto',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {!isSyncing ? (
                <Tooltip title="Sync Sources">
                  <ReplayIcon
                    data-testid="sync-button"
                    sx={{
                      cursor: 'pointer',
                      opacity: permissions.includes('can_sync_sources') ? 1 : 0.5,
                      fontSize: '20px',
                      '&:hover': { opacity: 0.7 },
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      console.log('here clicking the sync button');
                      handleSyncClick();
                    }}
                  />
                </Tooltip>
              ) : (
                <CircularProgress size={20} />
              )}
            </Box>
          )}
        </Box>
      </Box>
      {isEmptyDataFolder && node.isOpen && (
        <Box sx={{ pl: 4, py: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Typography variant="body2">No data sources available</Typography>
        </Box>
      )}
    </>
  );
};

interface ProjectTreeProps {
  dbtSourceModels: DbtModelResponse[];
  handleNodeClick: (...args: any) => void;
  handleSyncClick: (...args: any) => void;
  isSyncing?: boolean;
  included_in: 'explore' | 'visual_designer';
}

const ProjectTree = ({
  dbtSourceModels,
  handleNodeClick,
  handleSyncClick,
  isSyncing = false,
  included_in = 'visual_designer',
}: ProjectTreeProps) => {
  const { ref, width, height } = useResizeObserver();
  const [projectTreeData, setProjectTreeData] = useState<any[]>([]);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const searchTermRef = useRef('');
  const [filterBy, setFilterBy] = useState<'schema' | 'table'>('table');
  const [openByDefault, setOpenByDefault] = useState(false);

  const constructAndSetProjectTreeData = (dbtSourceModels: DbtModelResponse[]) => {
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
      {} as { [key: string]: DbtModelResponse[] }
    );

    // construct the tree data
    const treeData = Object.keys(leafNodesBySchema).map((schema: string, idx: number) => {
      return {
        id: String(idx + 1),
        schema: schema,
        children: leafNodesBySchema[schema].map((item: DbtModelResponse, j) => ({
          ...item,
          id: String(item.uuid),
        })),
      };
    });

    // Always show the Data folder, even if it's empty
    setProjectTreeData([{ id: '0', schema: 'Data', children: treeData }]);

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
        return dbtSourceModel.name.toLowerCase().includes(searchTerm.toLowerCase());
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
                <Checkbox
                  aria-label="filter by schema"
                  checked={filterBy === 'schema'}
                  onChange={() => setFilterBy('schema')}
                />
              }
              label="schema"
            />
            <FormControlLabel
              control={
                <Checkbox
                  aria-label="filter by table"
                  checked={filterBy === 'table'}
                  onChange={() => setFilterBy('table')}
                />
              }
              label="table"
            />
          </Box>
        </Box>
        {projectTreeData.length > 0 && (
          <Tree
            childrenAccessor={(d: any) => d.children}
            openByDefault={openByDefault || true} // Always open Data folder by default
            indent={8}
            data={projectTreeData}
            height={height}
            width={width}
            rowHeight={30}
            onSelect={permissions.includes('can_create_dbt_model') ? handleNodeClick : undefined}
          >
            {(props) => (
              <Node
                {...props}
                handleSyncClick={handleSyncClick}
                isSyncing={isSyncing}
                included_in={included_in}
              />
            )}
          </Tree>
        )}
      </Box>
    </Box>
  );
};

export default ProjectTree;
