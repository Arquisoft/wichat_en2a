Feature: Playing the game

  Scenario: A logged user wants to play
    Given A logged user
    When Clicking on play and choosing a gamemode
    Then  User starts playing
