// This test simulates a complete user registration and login flow.

describe('User Authentication Flow', () => {
  // Use a unique email for each test run to avoid conflicts
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const username = `testuser-${Date.now()}`;
  const password = 'password123';

  it('should allow a new user to register, log in, and see the home page', () => {
    // --- Registration Step ---
    // The baseUrl is configured in cypress.config.js, so we can use relative paths
    cy.visit('/register');

    // FIX: Change selector from 'input' to 'textarea' to match the component
    cy.get('textarea[placeholder="Username"]').type(username);
    cy.get('textarea[placeholder="Email"]').type(uniqueEmail);
    cy.get('textarea[placeholder="Password"]').type(password);

    // Submit the form
    cy.get('button').contains('Register').click();

    // --- Login Step ---
    // After successful registration, the app should navigate to the login page
    cy.url().should('include', '/login');

    // FIX: Change selector from 'input' to 'textarea'
    cy.get('textarea[placeholder="Email"]').type(uniqueEmail);
    cy.get('textarea[placeholder="Password"]').type(password);
    cy.get('button').contains('Login').click();

    // --- Verification Step ---
    // After a successful login, we should be on the home page
    // We'll look for the unique welcome message
    cy.contains('𝕎𝕖𝕝𝕔𝕠𝕞𝕖 𝕥𝕠 𝕥𝕙𝕖 𝕄𝕒𝕥𝕣𝕚𝕩!', { timeout: 10000 }).should('be.visible');
  });
});

