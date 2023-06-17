import moment from 'moment';

export const lastRunTime = (startTime: string) => {
  return moment(new Date(startTime)).fromNow();
};
