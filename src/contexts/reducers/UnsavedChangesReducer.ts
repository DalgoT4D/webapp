// UnsavedChangesReducer.js

// Initial state for unsaved changes
export const initialUnsavedChangesState = false;

// Reducer for handling unsaved changes
export const UnsavedChangesReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_UNSAVED_CHANGES':
      return true;
    case 'CLEAR_UNSAVED_CHANGES':
      return false;
    default:
      return state;
  }
};
