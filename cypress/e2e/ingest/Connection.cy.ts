describe('Add Connection', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('/api/dashboard/v1').as('dashboard');
    cy.wait(['@dashboard']);
  });

  it('Add new Connection', () => {
    cy.get('[data-testid="menu-item-2.1"]').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Connections');
    cy.get('[data-testid="add-new-connection"]').contains('+ New Connection').click();
    cy.get('[role="dialog"]').contains('Add a new connection');

    // Fill in the name field
    cy.contains('label', 'Name*').parent().find('input').type('cypress test con');

    // Open the dropdown
    cy.contains('label', 'Select source').parent().find('.MuiAutocomplete-popupIndicator').click();

    // Wait for the dropdown options to be visible, then click the item
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'cypress test src').click();
    cy.get('[data-testid="stream-sync-0"]').click();

    //intercept the api call here.
    cy.get('[type="submit"]').should('contain', 'Connect').should('not.be.disabled').click();

    cy.contains('td', 'cypress test con');
  });
});
