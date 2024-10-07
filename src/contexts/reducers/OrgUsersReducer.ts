// The reducer here will update the global state of the current selected org component
import { CurrentOrgStateInterface } from './CurrentOrgReducer';

export interface OrgUserStateInterface {
  email: string;
  active: boolean;
  role: number;
  role_slug: string;
  org: CurrentOrgStateInterface;
  wtype: string;
}

interface Action {
  type: 'new';
  orgUsersState: Array<OrgUserStateInterface>;
}

export const initialOrgUsersState = [];

export const OrgUsersReducer = (state: Array<OrgUserStateInterface>, updateAction: Action) => {
  switch (updateAction?.type) {
    case 'new':
      return updateAction.orgUsersState;
    default:
      return state;
  }
};
