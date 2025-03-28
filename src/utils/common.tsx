import moment from 'moment';
import cronstrue from 'cronstrue';
import { Tooltip } from '@mui/material';

export const lastRunTime = (startTime: string) => {
  return startTime ? moment(new Date(startTime)).fromNow() : '-';
};

export const localTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// minutes, hours, day of month, month, day of week
// 0 1 * * *
// WE ASSUME AND REQUIRE that d-o-m and m are always "*"
const cronToLocalTZ = (expression: string) => {
  if (!expression) return '';

  const fields = expression.split(' ');

  if (fields.length === 6) {
    fields.shift();
  }

  if (fields.length !== 5) {
    return '';
  }

  // Validating that day of month and month are always "*"
  if (fields[2] !== '*' || fields[3] !== '*') {
    console.warn('cronToLocalTZ: Expected day of month and month to be "*"');
    return expression;
  }

  try {
    const [minutes, hours] = fields; // these are the UTC minutes and hours

    // Create moment in UTC with the cron time
    const utcTime = moment.utc().hours(parseInt(hours, 10)).minutes(parseInt(minutes, 10));

    // Convert to local time
    const localTime = utcTime.local();

    return `${localTime.minutes()} ${localTime.hours()} ${fields[2]} ${fields[3]} ${fields[4]}`;
  } catch (error) {
    console.error('Error converting cron expression to local timezone:', error);
    return expression;
  }
};

export const cronToString = (expression: string) => {
  try {
    const localCron = cronToLocalTZ(expression);
    return cronstrue.toString(localCron, { verbose: true });
  } catch (error) {
    console.error('Error converting cron to human readable format:', error);
    return expression;
  }
};

export const getOrgHeaderValue = (verb: string, path: string) => {
  if (verb === 'GET' && ['currentuserv2', 'users/invitations'].includes(path)) {
    return '';
  } else if (
    verb === 'POST' &&
    ['organizations/', 'v1/organizations/users/invite/accept/'].includes(path)
  ) {
    return '';
  }
  return localStorage.getItem('org-slug') || '';
};

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const trimEmail = (email: string) => {
  return email.split('@')[0];
};

export const trimString = (string: string, length: number) => {
  return string.length > length ? (
    <Tooltip title={string} placement="top">
      <span>{string.slice(0, length) + '...'}</span>
    </Tooltip>
  ) : (
    string
  );
};

export const parseStringForNull = (st: string | null | undefined) => {
  if (st === null || st === undefined) {
    return null;
  }

  return st.trim().toLowerCase() === 'null' ? null : st;
};

export const toCamelCase = (str: string) => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/(^\w)/, (m) => m.toLowerCase());
};

export const formatDuration = (seconds: number) => {
  const duration = moment.duration(seconds, 'seconds');
  const days = Math.floor(duration.asDays());
  const hours = Math.floor(duration.hours());
  const minutes = Math.floor(duration.minutes());
  const secs = Math.floor(duration.seconds());

  let formattedDuration = '';

  if (days > 0) {
    formattedDuration += `${days}d `;
  }
  if (hours > 0) {
    formattedDuration += `${hours}h `;
  }
  if (minutes > 0) {
    formattedDuration += `${minutes}m `;
  }
  if (secs > 0 || formattedDuration === '') {
    formattedDuration += `${secs}s`;
  }

  return formattedDuration.trim();
};

export const copyToClipboard = (dataToCopy: any) => {
  return navigator.clipboard
    .writeText(dataToCopy)
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.error('Failed to copy text: ', err);
      return false;
    });
};

export const calculatePlanStatus = (endDateStr: string) => {
  const endDate = moment.utc(endDateStr);
  const now = moment.utc();

  const daysRemaining = endDate.diff(now, 'days');
  const hoursRemaining = endDate.diff(now, 'hours');
  const isExpired = hoursRemaining <= 0;
  const isLessThanAWeek = !isExpired && daysRemaining < 7;

  return {
    isExpired,
    isLessThanAWeek,
    daysRemaining,
    hoursRemaining,
  };
};
