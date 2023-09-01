import { createContext, useReducer } from 'react';
import {
  ToastReducer,
  initialToastState,
  ToastStateInterface,
} from './reducers/ToastReducer';
import {
  CurrentOrgReducer,
  initialCurrentOrgState,
  CurrentOrgStateInterface,
} from './reducers/CurrentOrgReducer';
import {
  OrgUsersReducer,
  initialOrgUsersState,
  OrgUserStateInterface,
} from './reducers/OrgUsersReducer';

import React from 'react';
import ToastMessage from '@/components/ToastMessage/ToastMessage';

interface context {
  Toast: { state: ToastStateInterface; dispatch: any };
  CurrentOrg: { state: CurrentOrgStateInterface; dispatch: any };
  OrgUsers: { state: Array<OrgUserStateInterface>; dispatch: any };
}
export const GlobalContext = createContext<context | null>(null);

const ContextProvider = ({ children }: any) => {
  // Toast reduces/logic-updater
  const [toast, toastDisptach]: [any, any] = useReducer<any>(
    ToastReducer,
    initialToastState
  );

  // Current org reducer/logic-updater
  const [currentOrg, currentOrgDispatch]: [any, any] = useReducer<any>(
    CurrentOrgReducer,
    initialCurrentOrgState
  );

  // Orgusers (for current user) reducer/logic-updater
  const [orgUsers, orgUsersDispatch]: [any, any] = useReducer<any>(
    OrgUsersReducer,
    initialOrgUsersState
  );

  // You can add other reducers here to have global state for different use cases with the same global context

  return (
    <GlobalContext.Provider
      value={{
        Toast: { state: toast, dispatch: toastDisptach },
        CurrentOrg: { state: currentOrg, dispatch: currentOrgDispatch },
        OrgUsers: { state: orgUsers, dispatch: orgUsersDispatch },
      }}
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
