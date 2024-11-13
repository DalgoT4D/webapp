// State Interfaces
export interface OrgPreferenceState {
  data: any; // Replace with actual type
  loading: boolean;
  error: string | null;
}

export interface UserSettingsState {
  data: any; // Replace with actual type
  loading: boolean;
  error: string | null;
}

// Combined State Interface
export interface SettingsState {
  orgPreference: OrgPreferenceState;
  userSettings: UserSettingsState;
}

// Initial States
export const initialOrgPreferenceState: OrgPreferenceState = {
  data: null,
  loading: false,
  error: null,
};

export const initialUserSettingsState: UserSettingsState = {
  data: null,
  loading: false,
  error: null,
};

// Reducers
export const OrgPreferenceReducer = (
  state: OrgPreferenceState,
  action: any
): OrgPreferenceState => {
  switch (action.type) {
    case 'FETCH_ORG_PREFERENCE_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_ORG_PREFERENCE_SUCCESS':
      return { ...state, loading: false, data: action.payload };
    case 'FETCH_ORG_PREFERENCE_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const UserSettingsReducer = (state: UserSettingsState, action: any): UserSettingsState => {
  switch (action.type) {
    case 'FETCH_USER_SETTINGS_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_USER_SETTINGS_SUCCESS':
      return { ...state, loading: false, data: action.payload };
    case 'FETCH_USER_SETTINGS_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
