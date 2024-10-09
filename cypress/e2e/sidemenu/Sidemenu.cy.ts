describe('Side menu', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Initial render of side menu', () => {
    // parent
    cy.get('[data-testid="side-menu"]').contains('Analysis').should('be.visible');

    cy.get('[data-testid="side-menu"]').contains('Pipeline overview').should('be.visible');

    cy.get('[data-testid="side-menu"]').contains('User management').should('be.visible');

    // Sub menus for Pipeline overview are by default visible
    cy.get('[data-testid="side-menu"]').contains('Ingest').should('be.visible');
    cy.get('[data-testid="side-menu"]').contains('Transform').should('be.visible');
    cy.get('[data-testid="side-menu"]').contains('Orchestrate').should('be.visible');
  });

  it('Toggle the side menu collapsible', () => {
    // Collapse the pipeline overview child items
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.get('[data-testid="child-menu-2"]').should('not.be.visible');

    // Click again to show the child menu items
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.get('[data-testid="child-menu-2"]').should('be.visible');
  });

  it('Switching between menu items', () => {
    // By default we see the pipeline overview window
    cy.get('h4').should('contain', 'Overview');

    // Go to user management
    cy.get('[data-testid="side-menu"] > li').eq(2).click();

    cy.get('h4').should('contain', 'Manage users');

    // Go to ingest
    cy.get('[data-testid="child-menu-2"] > li').eq(0).click();

    cy.get('h4').should('contain', 'Ingest');

    // Go to transform
    cy.get('[data-testid="child-menu-2"] > li').eq(1).click();

    cy.get('h4').should('contain', 'Transform');

    // Go to transform
    cy.get('[data-testid="child-menu-2"] > li').eq(2).click();

    cy.get('h4').should('contain', 'Pipelines');
  });
});
