// The reducer here will update the global state of the toast component
type severity = 'success' | 'error' | 'info' | 'warning';

export interface ToastStateInterface {
  open: boolean;
  severity: severity;
  message: string;
  messages?: Array<string>;
  seconds: number;
  handleClose: (...args: any) => any;
}

interface ToastAction {
  type: 'close' | 'new';
  toastState: ToastStateInterface;
}

interface PermissionAction {
  type: 'add';
  permissionState: string[];
}

export const initialToastState = {
  open: true,
  severity: 'error',
  message: 'initial state of toast message',
  seconds: 0,
  messages: [],
};

export const initialPermissionState = [];

export const PermissionReducer = (state: string[], updateAction: PermissionAction) => {
  switch (updateAction?.type) {
    case 'add':
      return updateAction.permissionState;

    default:
      return state;
  }
};

export const ToastReducer = (state: ToastStateInterface, updateAction: ToastAction) => {
  switch (updateAction?.type) {
    case 'close':
      return { ...state, open: false };

    case 'new':
      return updateAction?.toastState;
    default:
      return state;
  }
};
