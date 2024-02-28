import { primaryColor } from '@/config/theme';
import React from 'react';
import Joyride from 'react-joyride';
import { WalkThroughContent } from './WalkThroughContent';

interface StepContent {
  target: string;
  body: string;
}

interface ProductWalkProps {
  run: boolean;
  setRun: (...args: any) => any;
  steps: StepContent[];
}

export const ProductWalk = ({ run, steps }: ProductWalkProps) => {
  const handleJoyrideCallback = () => {};

  return (
    <Joyride
      callback={handleJoyrideCallback}
      run={run}
      continuous
      showProgress
      showSkipButton
      steps={steps.map((step: StepContent) => ({
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
