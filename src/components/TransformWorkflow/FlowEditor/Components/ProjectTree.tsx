import { Box, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Tree, NodeApi } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@/assets/icons/datatable.svg';
import { DbtSourceModel } from './Canvas';
import AddIcon from '@mui/icons-material/Add';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import useResizeObserver from 'use-resize-observer';
import { trimString } from '@/utils/common';
import Image from 'next/image';
import ReplayIcon from '@mui/icons-material/Replay';
import { GlobalContext } from '@/contexts/ContextProvider';

const Node = ({ node, style, dragHandle }: any) => {
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const width = node.tree.props.width;

  const stringLengthWithWidth = Math.abs(width / 15);
  /* This node instance can do many things. See the API reference. */
  const data: DbtSourceModel = node.data;
  let name: string | JSX.Element = !node.isLeaf ? data.schema : data.input_name;
  name = trimString(name, stringLengthWithWidth);
  const { setCanvasAction } = useCanvasAction();
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
      onClick={() => (node.isLeaf ? undefined : node.toggle())}
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
        {node.isLeaf && <AddIcon sx={{ ml: 'auto', cursor: 'pointer' }} />}
        {!node.isLeaf && node.level === 0 && (
          <Tooltip title="Sync Sources">
            <ReplayIcon
              sx={{
                ml: 'auto',
                cursor: 'pointer',
                opacity: permissions.includes('can_sync_sources') ? 1 : 0.5,
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (permissions.includes('can_sync_sources'))
                  setCanvasAction({ type: 'sync-sources', data: null });
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

interface ProjectTreeProps {
  dbtSourceModels: DbtSourceModel[];
}

// type TreeData = Partial<DbtSourceModel> & { children: TreeData[] };

const ProjectTree = ({ dbtSourceModels }: ProjectTreeProps) => {
  const { setCanvasAction } = useCanvasAction();
  const { ref, width, height } = useResizeObserver();
  const [projectTreeData, setProjectTreeData] = useState<any[]>([]);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const constructAndSetProjectTreeData = (dbtSourceModels: DbtSourceModel[]) => {
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
      {} as { [key: string]: DbtSourceModel[] }
    );

    // construct the tree data
    const treeData = Object.keys(leafNodesBySchema).map((schema: string, idx: number) => {
      return {
        id: String(idx + 1),
        schema: schema,
        children: leafNodesBySchema[schema],
      };
    });

    setProjectTreeData([{ id: '0', schema: 'Store', children: treeData }]);
  };

  useEffect(() => {
    if (dbtSourceModels) {
      console.log('rerendeirng project tree');
      constructAndSetProjectTreeData(dbtSourceModels);
    }
  }, [dbtSourceModels]);

  const handleNodeClick = (nodes: NodeApi<any>[]) => {
    if (nodes.length > 0 && nodes[0].isLeaf) {
      console.log('adding a node to canvas from project tree component', nodes[0].data);
      setCanvasAction({ type: 'add-srcmodel-node', data: nodes[0].data });
    }
  };

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
          {Node}
        </Tree>
      </Box>
    </Box>
  );
};

export default ProjectTree;
