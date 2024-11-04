import { v4 as uuidv4 } from 'uuid';

describe('Ingest', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Ingest in sub menu', () => {
    cy.get('[data-testid="side-menu"]').contains('Ingest').should('be.visible');

    cy.get('[data-testid="menu-item-2.1"]').should('be.visible');
  });

  it('Render ingest sub menu item', () => {
    cy.get('[data-testid="side-menu"]').contains('Ingest').click();
    cy.get('h4').should('contain', 'Ingest');
    // three tabs should be visible
    cy.get('[role="tab"]').should('have.length', 3);
    cy.get('[role="tab"]').eq(0).should('contain', 'Connections');
    cy.get('[role="tab"]').eq(1).should('contain', 'Sources');
    cy.get('[role="tab"]').eq(2).should('contain', 'Your Warehouse');
  });
});
