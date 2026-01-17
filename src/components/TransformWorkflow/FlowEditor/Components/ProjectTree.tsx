import { Box, CircularProgress, Tooltip, Typography, IconButton } from '@mui/material';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { Tree } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@/assets/icons/datatable.svg';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import useResizeObserver from 'use-resize-observer';
import Image from 'next/image';
import ReplayIcon from '@mui/icons-material/Replay';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import { TextField } from '@mui/material';
import { DbtModelResponse } from '@/types/transform-v2.types';
import { useParentCommunication } from '@/contexts/ParentCommunicationProvider';

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
              <Tooltip title="Add to canvas">
                <AddIcon
                  sx={{
                    cursor: 'pointer',
                    fontSize: '20px',
                    '&:hover': { opacity: 0.7 },
                  }}
                />
              </Tooltip>
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
  onClose?: () => void;
}

const ProjectTree = ({
  dbtSourceModels,
  handleNodeClick,
  handleSyncClick,
  isSyncing = false,
  included_in = 'visual_designer',
  onClose,
}: ProjectTreeProps) => {
  const { ref, width, height } = useResizeObserver();
  const [projectTreeData, setProjectTreeData] = useState<any[]>([]);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const searchTermRef = useRef('');
  const [openByDefault, setOpenByDefault] = useState(false);
  const { hideHeader } = useParentCommunication();

  // Calculate the height available for the tree by subtracting search area height
  const SEARCH_AREA_HEIGHT = 70; // Approximate height of search input + padding (reduced since no checkboxes)
  const BOTTOM_PADDING = 16; // Extra padding to prevent last element cutoff
  const treeHeight = height ? Math.max(200, height - SEARCH_AREA_HEIGHT - BOTTOM_PADDING) : 400;

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

    // Auto-expand when searching to show matching results
    if (searchTermRef.current.trim() !== '') {
      setOpenByDefault(true);
    } else {
      setOpenByDefault(false);
    }
  };

  const onSearchValueChange = (searchTerm: string) => {
    searchTerm = searchTerm.trim();

    if (searchTerm === '') {
      // Show all data when search is empty
      constructAndSetProjectTreeData(dbtSourceModels);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();

    // Filter models that match either schema name or table name
    const filteredData = dbtSourceModels.filter((dbtSourceModel) => {
      const schemaMatches = dbtSourceModel.schema.toLowerCase().includes(searchTermLower);
      const tableMatches = dbtSourceModel.name.toLowerCase().includes(searchTermLower);
      return schemaMatches || tableMatches;
    });

    constructAndSetProjectTreeData(filteredData);
  };

  useEffect(() => {
    if (dbtSourceModels) {
      onSearchValueChange(searchTermRef.current);
    }
  }, [dbtSourceModels]);

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
          display: 'flex',
          alignItems: 'center',
          px: 1,
        }}
      >
        {/* Show close button when header is hidden (embedded mode) */}
        {hideHeader && onClose && (
          <IconButton
            onClick={onClose}
            aria-label="close canvas"
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box
        sx={{
          p: '10px',
          pr: 0,
          pb: 0,
          height: 'calc(100% - 44px)',
          position: 'relative',
        }}
        ref={ref}
      >
        {isSyncing && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(245, 250, 250, 0.85)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={32} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                textAlign: 'center',
                px: 2,
              }}
            >
              Fetching latest schemas and tables...
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            px: 2,
            py: 1,
            opacity: isSyncing ? 0.5 : 1,
            pointerEvents: isSyncing ? 'none' : 'auto',
          }}
        >
          <TextField
            label="Search schemas and tables"
            placeholder="Type to search across schemas and tables..."
            onChange={(e) => {
              searchTermRef.current = e.target.value;
              onSearchValueChange(e.target.value);
            }}
            fullWidth
            size="small"
            disabled={isSyncing}
          />
        </Box>
        <Box
          sx={{
            opacity: isSyncing ? 0.5 : 1,
            pointerEvents: isSyncing ? 'none' : 'auto',
            pb: 2, // Add bottom padding to prevent last element cutoff
          }}
        >
          {projectTreeData.length > 0 && (
            <Tree
              childrenAccessor={(d: any) => d.children}
              openByDefault={openByDefault || true} // Always open Data folder by default
              indent={8}
              data={projectTreeData}
              height={treeHeight} // Use calculated height instead of container height
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
    </Box>
  );
};

export default ProjectTree;
