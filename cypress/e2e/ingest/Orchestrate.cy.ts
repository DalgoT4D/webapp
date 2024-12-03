describe('Orchestrate', () => {
  beforeEach(() => {
    cy.login('Admin');
  });

  it('Creates a pipleine', () => {
    cy.get('[data-testid="side-menu"]').contains('Pipeline overview').should('be.visible');

    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.get('[data-testid="side-menu"]').contains('Orchestrate').click();
    cy.get('[data-testid="add-new-pipeline"]').contains('+ New Pipeline').click({ force: true });

    //filling the details

    cy.contains('label', 'Name*').parent().find('input').type('cypress orchestrate test');
    // Open the dropdown
    cy.contains('label', 'Connections').parent().find('.MuiAutocomplete-popupIndicator').click();

    // Wait for the dropdown options to be visible, then click the item
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'cypress').click();

    // select run all tasks.
    cy.get('input[type="checkbox"]').check();

    // selecting when to run the task.
    cy.contains('label', 'Daily/Weekly').parent().find('.MuiAutocomplete-popupIndicator').click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'weekly').click();

    //selecting day of the week
    cy.contains('label', 'Day of the week')
      .parent()
      .find('.MuiAutocomplete-popupIndicator')
      .click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'Friday').click();

    //select the clock icon
    cy.get('[data-testid="ClockIcon"]').click();
    cy.contains('ul.MuiList-root.MuiMultiSectionDigitalClockSection-root', '01').click();
    cy.contains('button', 'OK').click();

    //Save this
    //api intercept here.
    cy.contains('button', 'Save changes').click();
    cy.contains('td', 'cypress orchestrate test');

    //run manually an orchestrate

    //her too inctercept and see
    cy.get('[data-testid="btn-quickrundeployment-cypress orchestrate test"]').click();
  });
});
