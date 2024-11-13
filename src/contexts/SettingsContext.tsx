import React, { createContext, useReducer, useEffect, useContext } from 'react';
import {
  OrgPreferenceReducer,
  UserSettingsReducer,
  initialOrgPreferenceState,
  initialUserSettingsState,
  OrgPreferenceState,
  UserSettingsState,
} from './reducers/SettingsReducer';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { GlobalContext } from './ContextProvider';
import useSWR from 'swr';

// Define the combined state interface
interface SettingsContextInterface {
  orgPreference: OrgPreferenceState;
  userSettings: UserSettingsState;
  dispatchOrgPreference: React.Dispatch<any>;
  dispatchUserSettings: React.Dispatch<any>;
  fetchOrgPreference: any;
  fetchUserSettings: any;
}

// Create the context
export const SettingsContext = createContext<SettingsContextInterface | null>(null);

// SettingsProvider Component
export const SettingsProvider = ({ children }: any) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  // Use separate reducers for orgPreference and userSettings
  const [orgPreference, dispatchOrgPreference] = useReducer(
    OrgPreferenceReducer,
    initialOrgPreferenceState
  );

  const [userSettings, dispatchUserSettings] = useReducer(
    UserSettingsReducer,
    initialUserSettingsState
  );

  const fetchOrgPreference = async () => {
    dispatchOrgPreference({ type: 'FETCH_ORG_PREFERENCE_REQUEST' });
    try {
      const { success, res } = await httpGet(session, `orgpreferences/11/`);
      if (!success) {
        dispatchOrgPreference({
          type: 'FETCH_ORG_PREFERENCE_FAILURE',
          payload: 'Something went wrong',
        });
        return;
      }
      dispatchOrgPreference({ type: 'FETCH_ORG_PREFERENCE_SUCCESS', payload: res });
    } catch (error: any) {
      console.error(error);
      dispatchOrgPreference({ type: 'FETCH_ORG_PREFERENCE_FAILURE', payload: error.message });
    }
  };

  const fetchUserSettings = async () => {
    dispatchUserSettings({ type: 'FETCH_USER_SETTINGS_REQUEST' });
    try {
      const { success, res } = await httpGet(session, 'userpreferences/');
      if (!success) {
        dispatchUserSettings({
          type: 'FETCH_USER_SETTINGS_FAILURE',
          payload: 'Something went wrong',
        });
      }
      dispatchUserSettings({ type: 'FETCH_USER_SETTINGS_SUCCESS', payload: res });
    } catch (error: any) {
      console.error(error);
      dispatchUserSettings({ type: 'FETCH_USER_SETTINGS_FAILURE', payload: error.message });
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserSettings();
      fetchOrgPreference();
    }
  }, [session]);

  return (
    <SettingsContext.Provider
      value={{
        orgPreference,
        userSettings,
        dispatchOrgPreference,
        dispatchUserSettings,
        fetchOrgPreference,
        fetchUserSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
