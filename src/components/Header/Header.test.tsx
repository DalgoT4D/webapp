import { fireEvent, render, screen } from '@testing-library/react';
import { Header } from './Header';
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';
import { Session } from 'next-auth';

describe('tests for page header', () => {
  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  const mockSession: Session = {
    expires: '1',
    user: { email: 'test@example.com', name: 'Delta', image: 'c' },
  };
  it('renders the logo', () => {
    render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    );

    const logo = screen.getByAltText('ddp logo');
    expect(logo).toBeInTheDocument();
  });

  it('opens the menu when the profile icon is clicked', () => {
    render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    );
    const profileIcon = screen.getByAltText('profile icon');
    fireEvent.click(profileIcon);
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('displays the user email in the menu', () => {
    render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    );
    const profileIcon = screen.getByAltText('profile icon');
    fireEvent.click(profileIcon);
    const userEmail = screen.getByText('test@example.com');
    expect(userEmail).toBeInTheDocument();
  });
});
