describe('Side menu', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Initial render of side menu', () => {
    // parent
    cy.get('[data-testid="side-menu"]')
      .contains('Pipeline overview')
      .should('be.visible');

    cy.get('[data-testid="side-menu"]')
      .contains('User management')
      .should('be.visible');

    // Sub menus for Pipeline overview are by default visible
    cy.get('[data-testid="side-menu"]').contains('Ingest').should('be.visible');
    cy.get('[data-testid="side-menu"]')
      .contains('Transform')
      .should('be.visible');
    cy.get('[data-testid="side-menu"]')
      .contains('Orchestrate')
      .should('be.visible');
  });

  it('Toggle the side menu collapsible', () => {
    // Collapse the pipeline overview child items
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .first()
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.get('[data-testid="child-menu-1"]').should('not.be.visible');

    // Click again to show the child menu items
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .first()
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.get('[data-testid="child-menu-1"]').should('be.visible');
  });

  it('Switching between menu items', () => {
    // By default we see the pipeline overview window
    cy.get('h4').should('contain', 'Overview');

    cy.get('[data-testid="side-menu"]')
      .find('li')
      .first()
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    // still the same window
    cy.get('h4').should('contain', 'Overview');
  });
});
