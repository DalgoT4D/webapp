import { render, screen } from '@testing-library/react';
import { DBTTarget, DbtBlock } from '../DBTTarget'
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';
import userEvent from '@testing-library/user-event';

describe("tests for dbt-target component", () => {

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it("checks for dbt action button", async () => {

    const mockSession: Session = {
      user: { email: 'a' },
    };

    const blocks: DbtBlock[] = [{
      blockName: 'run', action: 'run'
    } as DbtBlock];

    render(
      <SessionProvider session={mockSession}>
        <DBTTarget target="staging" blocks={blocks} />
      </SessionProvider>
    );

    const title = screen.getByTestId('title');
    expect(title).toHaveTextContent('staging');

    const expandButton = screen.getByTestId('expand-staging');
    await userEvent.click(expandButton);

    const runBlock = screen.getByTestId('dbtactionbutton-run')
    expect(runBlock).toBeVisible();

  });


});