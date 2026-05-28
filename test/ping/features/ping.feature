Feature: Ping Pong

  Scenario: Retorna pong con el mensaje recibido
    Given un mensaje de entrada "ping"
    When se ejecuta el use case
    Then la respuesta contiene message "pong"
    And la respuesta contiene echo "ping"
    And la respuesta contiene receivedAt con formato ISO

  Scenario: Falla con mensaje vacío
    Given un mensaje de entrada ""
    When se ejecuta el use case
    Then se lanza una ValidationException
