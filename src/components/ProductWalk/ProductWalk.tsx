import { primaryColor } from '@/config/theme';
import React from 'react';
import Joyride, {
  ACTIONS,
  EVENTS,
  ORIGIN,
  STATUS,
  CallBackProps,
  TooltipProps,
  TooltipRenderProps,
} from 'react-joyride';
import { WalkThroughContent } from './WalkThroughContent';
import { Box, Button, Tooltip } from '@mui/material';

interface StepContent {
  target: string;
  body: string;
}

interface ProductWalkProps {
  run: boolean;
  setRun: (...args: any) => any;
  steps: StepContent[];
}

export const ProductWalk = ({ run, steps, setRun }: ProductWalkProps) => {
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, origin, status, type } = data;
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      run={run}
      continuous
      showProgress
      showSkipButton
      steps={steps.map((step: StepContent, idx: number) => ({
        target: step.target,
        content: <WalkThroughContent body={step.body} />,
        placementBeacon: 'right',
      }))}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: primaryColor,
          width: '300px',
        },
      }}
    />
  );
};
