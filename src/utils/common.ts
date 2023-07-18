import moment from 'moment';
import cronstrue from 'cronstrue';

export const lastRunTime = (startTime: string) => {
  return startTime ? moment(new Date(startTime)).fromNow() : 'Not available';
};

export const cronToString = (expression: string) => {
  return cronstrue.toString(expression, { verbose: true });
};
