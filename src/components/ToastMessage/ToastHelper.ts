import { errorToastDuration } from '@/config/constant';
export const successToast = (message = '', messages: Array<string> = [], context: any) => {
  context?.Toast?.dispatch({
    type: 'new',
    toastState: {
      open: true,
      severity: 'success',
      seconds: 3,
      message: message,
      messages: messages,
    },
  });
};

export const errorToast = (message = '', messages: Array<string> = [], context: any) => {
  context?.Toast?.dispatch({
    type: 'new',
    toastState: {
      open: true,
      severity: 'error',
      seconds: errorToastDuration,
      message: message,
      messages: messages,
    },
  });
};
