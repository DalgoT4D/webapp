describe('Data Analysis Workflow - Create, Save, Modify, and Save Again', () => {
  beforeEach(() => {
    cy.login();
  });

  it.only('should create a summary, save it, open saved session, modify, and save again', () => {
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(0)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-0.2"]').click();
    // Step 1: Enter a SQL query
    cy.get('[data-testid="sqlTest-box"]').type('select * from staging.worldometer_data');

    cy.get('[name="prompt"]')
      .type('Give me the summary of the result in 5 points')
      .should('have.value', 'Give me the summary of the result in 5 points');

    cy.get('[data-testid="1-default"]').click();
    cy.get('[name="prompt"]').should('have.value', 'Summarize the results of the query');
    // Step 2: Click the "Submit" button to generate the summary
    cy.intercept('POST', '/api/warehouse/ask/').as('generateSummary');
    cy.intercept('GET', 'api/tasks/stp/**').as('pollsummary');

    // Step 1: Trigger the process
    cy.contains('button', 'Submit').click();

    // Step 2: Wait for the summary generation process to complete
    cy.wait('@generateSummary').then((interception) => {
      console.log(interception.response, 'RESPONSE');
      expect(interception.response.statusCode).to.eq(200);
      cy.contains('Data analysis initiated successfully').should('exist');
    });

    // Step 3: Poll until the status is 'completed'
    function waitForPollingToComplete() {
      cy.wait('@pollsummary').then((interception) => {
        const progress = interception.response?.body?.progress;

        // Check if the second progress item exists and has a status of 'completed'
        if (progress && progress[1]?.status === 'completed') {
          // Step 4: Save the summary with a session name
          cy.contains('button', 'Save as').click();
          //   cy.get('[name="sessionName"]')
          //     .then(($textarea) => {
          //       console.log($textarea, 'TEXTAREA');
          //     })
          //     .click();
          cy.get('.MuiDialog-container .MuiInputBase-root').click({ multiple: true });

          // .type('Test Saved Summary');
        } else {
          // If not completed, call the function recursively to wait for the next poll
          waitForPollingToComplete();
        }
      });
    }

    // Start polling
    waitForPollingToComplete();

    // cy.contains('button', 'Save').click();

    // // Step 5: Wait for the save operation to complete
    // cy.intercept('POST', '/api/warehouse/ask/**/save').as('saveSession');
    // cy.wait('@saveSession').then((interception) => {
    //   expect(interception.response.statusCode).to.eq(200);
    //   cy.contains('Test Session saved successfully').should('exist');
    // });

    // // Step 6: Open the saved sessions list and select the saved session
    // cy.get('[data-testid="saved-sessions-button"]').click();
    // cy.contains('Test Session').click();

    // // Step 7: Verify the saved session data is loaded
    // cy.contains('Test Session').should('exist');
    // cy.contains('SELECT * FROM users;').should('exist');
    // cy.contains('Summary generated successfully').should('exist');

    // // Step 8: Modify the prompt in the opened session
    // cy.get('textarea[placeholder="Enter your customized prompt here"]')
    //   .clear()
    //   .type('SELECT * FROM orders WHERE status = "shipped";')
    //   .should('have.value', 'SELECT * FROM orders WHERE status = "shipped";');

    // // Step 9: Generate a new summary for the modified prompt
    // cy.get('[data-testid="submit-button"]').click();
    // cy.intercept('POST', '/api/warehouse/ask/**').as('generateNewSummary');
    // cy.wait('@generateNewSummary').then((interception) => {
    //   expect(interception.response.statusCode).to.eq(200);
    //   cy.contains('New summary generated successfully').should('exist');
    // });

    // // Step 10: Save the new summary under the same session name
    // cy.get('[data-testid="save-session-button"]').click();
    // cy.get('[data-testid="confirm-overwrite-button"]').click();

    // // Step 11: Wait for the overwrite save operation to complete
    // cy.intercept('POST', '/api/warehouse/ask/**/save').as('overwriteSession');
    // cy.wait('@overwriteSession').then((interception) => {
    //   expect(interception.response.statusCode).to.eq(200);
    //   cy.contains('Test Session saved successfully').should('exist');
    // });

    // // Step 12: Re-open the session and verify updated data
    // cy.get('[data-testid="saved-sessions-button"]').click();
    // cy.contains('Test Session').click();
    // cy.contains('SELECT * FROM orders WHERE status = "shipped";').should('exist');
    // cy.contains('New summary generated successfully').should('exist');
  });
});
