import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
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

    setProjectTreeData([{ id: '0', schema: 'Data', children: treeData }]);
  };

  useEffect(() => {
    if (dbtSourceModels) {
      constructAndSetProjectTreeData(dbtSourceModels);
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
        <Tree
          childrenAccessor={(d: any) => d.children}
          openByDefault={false}
          data={projectTreeData}
          height={height}
          width={width}
          rowHeight={30}
          onSelect={permissions.includes('can_create_dbt_model') ? handleNodeClick : undefined}
        >
          {(props) => <Node {...props} handleSyncClick={handleSyncClick} isSyncing={isSyncing} />}
        </Tree>
      </Box>
    </Box>
  );
};

export default ProjectTree;
