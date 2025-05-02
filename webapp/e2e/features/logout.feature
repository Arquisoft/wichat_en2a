Feature: Logout from the application

  Scenario: A logged user wants to logout
    Given A logged user
    When Clicking on nav bar 'Log Out' button
    Then The user is logged out