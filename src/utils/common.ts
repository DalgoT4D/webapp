import moment from 'moment';
import cronstrue from 'cronstrue';

export const lastRunTime = (startTime: string) => {
  return startTime ? moment(new Date(startTime)).fromNow() : 'Not available';
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

// console.log(cronToLocalTZ('0 0 * * 0'));
// console.log(cronToLocalTZ('0 20 * * 1'));

export const cronToString = (expression: string) => {
  return cronstrue.toString(cronToLocalTZ(expression), { verbose: true });
};

export const getOrgHeaderValue = (verb: string, path: string) => {
  if (verb === 'GET' && ['currentuserv2', 'users/invitations'].includes(path)) {
    return '';
  } else if (
    verb === 'POST' &&
    ['organizations/', 'organizations/users/invite/accept/'].includes(path)
  ) {
    return '';
  }
  return localStorage.getItem('org-slug') || '';
};

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
