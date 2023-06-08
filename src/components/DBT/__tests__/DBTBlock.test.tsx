import { render, screen } from '@testing-library/react';
import { DBTBlock } from '../DBTBlock'
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';

describe("tests for dbt-block component", () => {

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it("checks for dbt action button", () => {

    const mockSession: Session = {
      expires: '1',
      user: { email: 'a', name: 'Delta', image: 'c' },
    };

    render(
      <SessionProvider session={mockSession}>
        <DBTBlock blockName="dbt-block-name" action="dbt-block-action" />
      </SessionProvider>
    );

    const actionButton = screen.getByTestId('dbtactionbutton');

    expect(actionButton).toHaveTextContent('dbt dbt-block-action');

  });


});