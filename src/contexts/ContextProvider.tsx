import { createContext, useReducer } from 'react';
import { ToastReducer, initialToastState } from './reducers/ToastReducer';

import React from 'react';
import ToastMessage from '@/components/ToastMessage/ToastMessage';

interface resourceContextInterface {
  state: any;
  dispatch: any;
}

interface context {
  Toast: resourceContextInterface;
}
export const GlobalContext = createContext<context | null>(null);

const ContextProvider = ({ children }: any) => {
  // Toast reduces/logic-updater
  const [toast, toastDisptach]: [any, any] = useReducer<any>(
    ToastReducer,
    initialToastState
  );

  // You can add other reducers here to have global state for different use cases with the same global context

  return (
    <GlobalContext.Provider
      value={{ Toast: { state: toast, dispatch: toastDisptach } }}
    >
      {children}
      <ToastMessage
        open={toast.open}
        severity={toast.severity}
        seconds={toast.seconds}
        message={toast.message}
        messages={toast.messages}
        handleClose={() => toastDisptach({ type: 'close', toastState: '' })}
      />
    </GlobalContext.Provider>
  );
};

export default ContextProvider;
