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

  // Parse the original cron values
  const minutes = parseInt(fields[0], 10);
  const hours = parseInt(fields[1], 10);

  const utcTime = moment.utc().hour(hours).minute(minutes);

  const localTime = utcTime.local();

  // Check if day boundary was crossed
  const dayCrossed = utcTime.format('YYYY-MM-DD') !== localTime.format('YYYY-MM-DD');

  // Only adjust day of week if it's specified and day boundary was crossed
  if (fields[4] !== '*' && dayCrossed) {
    const daysOfWeek = fields[4].split(',').map((d) => parseInt(d, 10));

    // Determine the direction of day shift
    const dayShift = utcTime.isBefore(localTime) ? 1 : -1;

    // Adjust each day of week
    const adjustedDays = daysOfWeek
      .map((day) => {
        let newDay = (day + dayShift) % 7;
        if (newDay < 0) newDay += 7;
        return newDay;
      })
      .join(',');

    return `${localTime.minute()} ${localTime.hour()} ${fields[2]} ${fields[3]} ${adjustedDays}`;
  }

  // If no day adjustment needed, just update the time
  return `${localTime.minute()} ${localTime.hour()} ${fields[2]} ${fields[3]} ${fields[4]}`;
};

export const cronToString = (expression: string) => {
  return cronstrue.toString(cronToLocalTZ(expression), { verbose: true });
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
