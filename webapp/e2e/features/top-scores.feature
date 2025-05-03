Feature: Seeing top scores

  Scenario: A logged user wants to see top scores
    Given A logged user
    When Clicking on top scores
    Then Application's top scores are displayed