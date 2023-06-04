import { DBTBlock } from '@/components/DBT/DBTBlock';
import {
  Box,
  Card,
  CardActions,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import React, { useState } from 'react';

type DbtBlock = {
  blockName: string;
  displayName: string;
  target: string;
  action: string;
};

type params = {
  target: string;
  blocks: DbtBlock[];
};

export const DBTTarget = ({ target, blocks }: params) => {

  const [expandTarget, setExpandTarget] = useState<boolean>(false);

  return (
    <>
      <Card sx={{
        marginTop: '10px',
        padding: '10px',
        borderRadius: '8px',
        color: '#092540',
      }}>
        <CardActions
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Box>{target}</Box>
          <IconButton onClick={() => setExpandTarget(!expandTarget)}>
            <ExpandMoreIcon
              sx={{
                transform: !expandTarget ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            />
          </IconButton>
        </CardActions>
        <Collapse in={expandTarget} unmountOnExit>
          {
            blocks.map((block: DbtBlock) => (
              <DBTBlock
                key={block.blockName}
                blockName={block.blockName}
                action={block.action} />
            ))
          }
        </Collapse>
      </Card>
    </>

  )
}