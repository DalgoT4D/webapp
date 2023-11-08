describe('Add source', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('/api/dashboard').as('dashboard');
    cy.wait(['@dashboard']);
  });

  it('Add source', () => {
    cy.get('[data-testid="side-menu"]').contains('Ingest').click();
    cy.get('[data-testid="side-menu"]').contains('Ingest').click();
    cy.get('h4').should('contain', 'Ingest');

    // three tabs should be visible
    cy.intercept('/api/airbyte/sources').as('sources');
    cy.get('[role="tab"]').should('have.length', 3);
    cy.get('[role="tab"]').eq(1).should('contain', 'Sources');
    cy.get('[role="tab"]').eq(1).click();
    cy.wait(['@sources']);
    cy.intercept('/api/airbyte/source_definitions').as('source_definitions');
    cy.wait(['@source_definitions']);

    // create source button should be present
    cy.get('[data-testid="add-new-source"]').should('be.visible');

    // create source
    cy.get('[data-testid="add-new-source"]').click();
    cy.get('[role="combobox"]').type('Google Sheets');
    cy.contains('Google Sheets').click();
    cy.get('[data-testid="autocomplete"]')
      .contains('label', 'Authentication')
      .parent()
      .find('input')
      .type('Service');
    cy.contains('Service').click();

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Service Account Information.')
      .parent()
      .find('input')
      .type(JSON.stringify(Cypress.env('SRC_GSHEETS_SERVICE_ACCOUNT')), {
        parseSpecialCharSequences: false,
      });

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Row Batch Size')
      .parent()
      .find('input')
      .type('200');

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Spreadsheet Link')
      .parent()
      .find('input')
      .type(Cypress.env('SRC_GSHEETS_SPREADSHEET_LINK'), {
        parseSpecialCharSequences: false,
      });

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Name')
      .parent()
      .find('input')
      .type('cypress_test_source');

    cy.get('[data-testid="savebutton"]').click();

    cy.intercept('/api/airbyte/sources/check_connection').as(
      'check_connection'
    );
    cy.wait(['@check_connection'], { timeout: 120000 });
  });
});
