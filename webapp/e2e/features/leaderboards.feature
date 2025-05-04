Feature: Seeing leaderboards

  Scenario: A logged user wants to see the leaderboards
    Given A logged user
    When Clicking on leaderboards
    Then Leaderboards are displayed
