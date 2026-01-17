import '@testing-library/jest-dom';

// Mock the useParentCommunication hook globally for all tests
jest.mock('@/contexts/ParentCommunicationProvider', () => ({
  useParentCommunication: () => ({
    hideHeader: false,
    isEmbedded: false,
    parentOrigin: null,
    sendMessageToParent: jest.fn(),
  }),
  ParentCommunicationProvider: ({ children }: { children: React.ReactNode }) => children,
}));
