import { v4 as uuidv4 } from 'uuid';

describe('Header', () => {
  beforeEach(() => {
    cy.login('Admin');
    // need to wait since the create org api takes time
    // cypress is intelligent to figure out the call with just the dynamic path
    cy.intercept('/api/dashboard/v1').as('dashboard');
    cy.wait(['@dashboard']);
  });

  it('Should render logo and profile icon', () => {
    cy.get('[alt="dalgo logo"]').should('be.visible');
    cy.get('[alt="profile icon"]').should('be.visible');
  });

  it('Render profile modal menu', () => {
    cy.get('[alt="profile icon"]').click();
    // check logged in user is our cypress env user
    cy.get('h6').should('contain', Cypress.env('username'));
    // should also have create new org option
    // cy.get('h6').should('contain', 'Create new org');
  });

  // it('Create org & select it', () => {
  //   const name = `cyp_${uuidv4()}`;
  //   cy.get('[alt="profile icon"]').click();
  //   // cy.contains('h6', 'Create new org').click();
  //   // enter org name
  //   cy.get('[data-testid="input-orgname"]').type(name);
  //   // submit
  //   cy.get('[data-testid="savebutton"]').click();
  //   // wait till the call is completed
  //   cy.wait(12000);
  //   // check if the newly created org is selected
  //   cy.get('h6').should('contain', name);
  // });

  it('Switch between org', () => {
    cy.get('[alt="profile icon"]').click();
    cy.get('[role="menuitem"]')
      .should('have.length.greaterThan', 2)
      .then(() => {
        cy.get('[role="menuitem"]').eq(0).click();
        cy.get('body').click(0, 0);
        cy.get('[alt="profile icon"]').click();
        cy.get('[role="menuitem"]').eq(1).click();
        cy.get('body').click(0, 0);
      });
  });
});
