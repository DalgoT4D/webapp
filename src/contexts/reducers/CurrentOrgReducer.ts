// The reducer here will update the global state of the current selected org component

export interface CurrentOrgStateInterface {
  slug: string;
  name: string;
  airbyte_workspace_id: string;
  viz_url: string;
  viz_login_type: string;
}

interface Action {
  type: 'new';
  orgState: CurrentOrgStateInterface;
}

export const initialCurrentOrgState = {
  slug: '',
  name: '',
  airbyte_workspace_id: '',
  viz_url: '',
  viz_login_type: '',
};

export const CurrentOrgReducer = (
  state: CurrentOrgStateInterface,
  updateAction: Action
) => {
  switch (updateAction?.type) {
    case 'new':
      return updateAction.orgState;
    default:
      return state;
  }
};
