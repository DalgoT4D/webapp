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

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Select source type')
      .parent()
      .find('input')
      .type('Kobotoolbox');

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Select source type')
      .parent()
      .get('.MuiAutocomplete-listbox li')
      .contains('Kobotoolbox')
      .invoke('show') // Trigger the 'show' event on the option
      .click();

    // Cypress is not allowing me to type the correct service account json & hence check connection fials
    // Google sheets specific fields
    // cy.get('[data-testid="autocomplete"]')
    //   .contains('label', 'Authentication')
    //   .parent()
    //   .find('input')
    //   .type('Service');
    // cy.get('[data-testid="create-source-dialog"]')
    //   .contains('label', 'Authentication')
    //   .parent()
    //   .get('.MuiAutocomplete-listbox li')
    //   .contains('Service')
    //   .invoke('show')
    //   .click();

    // cy.get('[data-testid="create-source-dialog"]')
    //   .contains('label', 'Service Account Information.')
    //   .parent()
    //   .find('input')
    //   .type(
    //     JSON.stringify(Cypress.env('SRC_GSHEETS_SERVICE_ACCOUNT'))
    //       .replace(/[\"]/g, '\\"')
    //       .replace(/[\\]/g, '\\\\')
    //       .replace(/[\/]/g, '\\/')
    //       .replace(/[\b]/g, '\\b')
    //       .replace(/[\f]/g, '\\f')
    //       .replace(/[\n]/g, '\\n')
    //       .replace(/[\r]/g, '\\r')
    //       .replace(/[\t]/g, '\\t'),
    //     {
    //       parseSpecialCharSequences: false,
    //     }
    //   );

    // cy.get('[data-testid="create-source-dialog"]')
    //   .contains('label', 'Row Batch Size')
    //   .parent()
    //   .find('input')
    //   .type('10');

    // cy.get('[data-testid="create-source-dialog"]')
    //   .contains('label', 'Spreadsheet Link')
    //   .parent()
    //   .find('input')
    //   .type(Cypress.env('SRC_GSHEETS_SPREADSHEET_LINK'), {
    //     parseSpecialCharSequences: false,
    //   });

    // cy.get('[data-testid="create-source-dialog"]')
    //   .contains('label', 'Name')
    //   .parent()
    //   .find('input')
    //   .type('cypress_test_source');

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Username')
      .parent()
      .find('input')
      .type(Cypress.env('SRC_KOBO_USERNAME'));

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Password')
      .parent()
      .find('input')
      .type(Cypress.env('SRC_KOBO_PASSWORD'));

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Base Url')
      .parent()
      .find('input')
      .type(Cypress.env('SRC_KOBO_BASE_URL'));

    cy.get('[data-testid="create-source-dialog"]')
      .contains('label', 'Name')
      .parent()
      .find('input')
      .type('cypress test src');

    cy.get('[data-testid="savebutton"]').click();

    cy.intercept('/api/airbyte/sources/check_connection').as('check_connection');

    cy.contains('td', 'cypress test src');
  });
});
