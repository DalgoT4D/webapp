import { render, screen } from '@testing-library/react';
import { DBTCreateProfile } from '../DBTCreateProfile'
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import * as nextRouter from 'next/router';
import userEvent from '@testing-library/user-event';

describe("tests for dbt-block component", () => {

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it("checks for the containing dialog", async () => {

    const mockSession: Session = {
      expires: 'false',
      user: { email: 'a' },
    };

    const mockCreatedProfile = jest.fn();

    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(
        {
          success: true,
        }
      )
    });
    (global as any).fetch = mockedFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTCreateProfile
          createdProfile={() => mockCreatedProfile()}
          showDialog={true}
          setShowDialog={() => { }}
        />
      </SessionProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const savebutton = screen.getByTestId('savebutton');
    expect(savebutton).toBeInTheDocument();

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    const profilename = screen.getByTestId('profilename');
    expect(profilename).toBeInTheDocument();

    const targetschema = screen.getByTestId('targetschema');
    expect(targetschema).toBeInTheDocument();

    expect(mockCreatedProfile).not.toHaveBeenCalled();

    const profileInput = screen.getByLabelText('Profile name from dbt_project.yml');
    await userEvent.type(profileInput, "profilename");
    await userEvent.click(savebutton);

    expect(mockCreatedProfile).toHaveBeenCalled();

  });


});