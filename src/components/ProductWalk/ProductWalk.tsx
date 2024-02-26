import { primaryColor } from '@/config/theme';
import React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { WalkThroughContent } from './WalkThroughContent';

interface StepContent {
  target: string;
  body: string;
}

interface ProductWalkProps {
  run: boolean;
  steps: StepContent[];
}

export const ProductWalk = ({ run, steps }: ProductWalkProps) => {
  return (
    <Joyride
      callback={() => {}}
      hideCloseButton
      run={run}
      showProgress
      showSkipButton
      steps={steps.map((step) => ({
        target: step.target,
        content: <WalkThroughContent body={step.body} />,
      }))}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: primaryColor,
        },
      }}
    />
  );
};
