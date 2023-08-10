// The reducer here will update the global state of the current organization

export interface OrgStateInterface {
  slug: string;
  viz_url: string;
}

export const initialOrgState = {
  slug: '',
  viz_url: '',
};

export const OrgReducer = (state: OrgStateInterface) => {
  return { ...state };
};
