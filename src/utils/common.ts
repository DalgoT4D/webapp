import moment from 'moment';

export const lastRunTime = (startTime: string) => {
  return startTime
    ? moment(new Date(startTime)).fromNow()
    : 'Not available';
};
