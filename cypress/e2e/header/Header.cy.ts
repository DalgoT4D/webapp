import { v4 as uuidv4 } from 'uuid';

describe('Header', () => {
  beforeEach(() => {
    cy.login();
    // need to wait since the create org api takes time
    // cypress is intelligent to figure out the call with just the dynamic path
    cy.intercept('/api/dashboard').as('pipeline');
    cy.wait(['@pipeline']);
  });

  it('Should render logo and profile icon', () => {
    cy.get('[alt="ddp logo"]').should('be.visible');
    cy.get('[alt="profile icon"]').should('be.visible');
  });

  it('Render profile modal menu', () => {
    cy.get('[alt="profile icon"]').click();
    // check logged in user is our cypress env user
    cy.get('h6').should('contain', Cypress.env('username'));
    // should also have create new org option
    cy.get('h6').should('contain', 'Create new org');
  });

  it('Create org', () => {
    const name = `cyp_${uuidv4()}`;
    cy.get('[alt="profile icon"]').click();
    cy.contains('h6', 'Create new org').click();
    // enter org name
    cy.get('[data-testid="input-orgname"]').type(name);
    // submit
    cy.get('[data-testid="savebutton"]').click();
    // wait till the call is completed
    cy.intercept('/api/organizations').as('orgs');
    cy.intercept('/api/dashboard').as('pipeline');
    cy.wait(['@pipeline', '@orgs'], { timeout: 20000 });
    // check if the newly created org is selected
    cy.get('h6').should('contain', name);
  });
});
