import React from 'react';
import { SideDrawer } from './SideDrawer';

import Router from 'next/router';

describe('<SideDrawer />', () => {
  it('should select the list item if we click on it', () => {
    cy.stub(Router, 'useRouter').returns({
      push: cy.stub().as('push'),
    });
    // see: https://on.cypress.io/mounting-react
    cy.mount(<SideDrawer />);
    const sideBarButton = cy.get('[data-test="listButton"]').first();
    sideBarButton.should('not.have.class', 'Mui-selected');
    sideBarButton.click();
    sideBarButton.should('have.class', 'Mui-selected');
    cy.get('@push').should('have.been.calledWith', '/analysis');
  });
});
