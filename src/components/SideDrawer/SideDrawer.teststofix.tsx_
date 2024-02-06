import { render, screen, waitFor } from '@testing-library/react';
import { SideDrawer } from './SideDrawer';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
const user = userEvent.setup();

const pushMock = jest.fn();
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

describe('Side drawer', () => {
  it('renders ', () => {
    render(<SideDrawer />);
    expect(screen.getAllByTestId('listButton').at(0)).toHaveTextContent(
      'Analysis'
    );
  });

  it('renders ', async () => {
    render(<SideDrawer />);
    const button = screen.getAllByTestId('listButton').at(0);
    user.click(button);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/analysis');
    });
  });
});
