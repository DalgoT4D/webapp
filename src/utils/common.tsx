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
  const fields = expression.split(' ');

  if (fields.length === 6) {
    fields.shift();
  }

  if (fields.length !== 5) {
    return '';
  }

  let timezoneOffset = new Date().getTimezoneOffset();
  // timezoneOffset = 6 * 60;
  timezoneOffset = -timezoneOffset;

  const hours = Math.round(timezoneOffset / 60 - 0.5);
  const minutes = timezoneOffset - 60 * hours;

  const newFields = [];
  let newHours = parseInt(fields[1], 10) + hours;
  let newMinutes = parseInt(fields[0], 10) + minutes;
  let newDoW = fields[4];

  if (newMinutes >= 60) {
    newMinutes -= 60;
    newHours += 1;
  } else if (newMinutes < 0) {
    newMinutes += 60;
    newHours -= 1;
  }

  const adjustDaysBy = function (dowStr: string, delta: number) {
    let dowInt = parseInt(dowStr, 10);
    dowInt += delta;
    while (dowInt >= 7) {
      dowInt -= 7;
    }
    while (dowInt < 0) {
      dowInt += 7;
    }
    return String(dowInt);
  };

  if (newHours >= 24) {
    newHours -= 24;
    if (newDoW !== '*') {
      newDoW = newDoW
        .split(',')
        .map((dowStr: string) => adjustDaysBy(dowStr, 1))
        .join(',');
    }
  } else if (newHours < 0) {
    newHours += 24;
    if (newDoW !== '*') {
      newDoW = newDoW
        .split(',')
        .map((dowStr: string) => adjustDaysBy(dowStr, -1))
        .join(',');
    }
  }

  newFields.push(newMinutes);
  newFields.push(newHours);
  newFields.push(fields[2]);
  newFields.push(fields[3]);
  newFields.push(newDoW);

  return newFields.join(' ');
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

export const formatDateTimeStringToLocalTimeZone = (dateTimeString: string) => {
  return moment(dateTimeString).format('Do MMM hh:mmA');
};
