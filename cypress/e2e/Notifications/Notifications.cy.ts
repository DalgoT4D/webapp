describe('Notifications', () => {
  beforeEach(() => {
    cy.login('Admin');
  });

  it('renders the notifications if any and mark them read or unread', () => {
    cy.get('.MuiBox-root.css-9ys6qa') // Locate the element with the specified class
      .find('button') // Find the button inside that element
      .click();

    //   intercepting
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'all');
    cy.get('[role="tab"][tabindex="-1"]').eq(0).should('contain', 'read');
    cy.get('[role="tab"][tabindex="-1"]').eq(1).should('contain', 'unread');

    cy.intercept('GET', '/api/notifications/v1?limit=10&page=1').as('getNotifications');

    //checking unread notifications
    cy.get('[role="tab"][tabindex="-1"]').eq(1).should('contain', 'unread').click();
    cy.contains('p', 'Showing 0 of 0 notifications').should('be.visible');

    cy.get('[role="tab"][tabindex="-1"]').eq(1).should('contain', 'read').click();
    //making all read notifications as unread
    cy.get('[data-testid="select-all-checkbox"]').click();
    cy.contains('button', 'Mark as unread').click();

    //again going to unread
    cy.get('[role="tab"][tabindex="-1"]').eq(1).should('contain', 'unread').click();
    cy.contains('p', 'Showing 10 of 10 notifications').should('be.visible');

    //selecting and making them read.
    cy.get('[data-testid="select-all-checkbox"]').click();
    cy.contains('button', 'Mark as read').click();
    cy.contains('p', 'Showing 0 of 0 notifications').should('be.visible');
  });
});
