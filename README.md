# UNO GAME
This project is the backend implementation of the game UNO. This project is based on API Rest as part of the capstone project for Programming 4.
## technology stack
- NodeJS 
- ExpressJS
- MySQL
- Sequelize


## Architecture
This project follows the onion architecture, where the components are separated in different layers:
- Domain: This layer contains the implementation of the data access logic. In this layer are contained:
    - Repositories: Implementation of the data access logic
    - Models: Definition of the table structure for the ORM
    - database: Definition of the conection with the database

- Application: This layer contains the implementation of the business logic. Here is processed the data applying the different rules of the system. In this layer are contained:
    - Services: Implementation of the business logic
    - dto: Pure functions that allow us to define the data that will be returned.
    
- Presentation: This layer contains the implementation of the different interactive resources of the API, being the different endpoints. In this layer are contained:

    - Controllers: Definition of the functions that will have the API
    - Routes: Definitions of the URIs and type of request for the functions of controllers
    - Middlewares: functions that will be executed before of processing a request
    - schemas: Definition of the request body structure for the requests.

## Requirements before the installation
You must have the following tools:
1. Have an available mysql database.
2. Have installed node v24 or higher.

## Installation
1. Install the dependencies:
```bash
npm install
```
2. configure the `.env` file:
```
PORT=3000
JWT_SECRET=secret

DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=db
DATABASE_USER=user
DATABASE_PASSWORD=user

ERROR_LOG_ROUTE=route/to/error.log
```
## How to use
1. To run the system you need to run the following command:
```bash
npm start
```

### Authentication
You can authenticate you in the system using the following endpoints:
- POST `/auth/register`: Register yourself in the system creating an account.
- POST `/auth/login`: Login in the system using your email and password.
- POST `/auth/logout`: Logout from your session using your access token.

### Management of game
You can handle a game in the system using the following endpoints:
- POST `/games`: Create a game
- PUT `/games/{id}`: update a game that is still in waiting state.
- PUT `/games/start`: Start a game when there are enough players.

### Join to game
You can join to a game using the following endpoint:
- POST `/games/{gameId}/players`

### Playing in a game
There are available different features while you are playing:
- POST `/games/{gameId}/distribute`:  You can distribute the initial cards between the players in the game from the deck. You can specify the quantity of cards per player in the request body.
- PUT `/game/{gameId}/play`: You can play a specific from your hand. If the card matches with top card from the discard stack and follow the rules, the card will leave your hand and will go to discard stack.
- PUT `/games/{gameId}/draw`: If you don't have a valid card to play in your turn, you will need to draw a card from the deck. Use this endpoint if in any case you must draw cards.
- PATCH `/games/{gameId}/say-uno`: You can say uno when you only have one card in your hand.
- POST `/games/{gameId}/challenge`: Challenge another player he  has not yet said 'uno'.
- GET `/games/{gameId}/players/current`: You can get the current player that must play in the game.
- GET `/games/{gameId}/cards/top-card`: You can get the top card in the discard stack.
- GET `/games/{gameId}/cards/hand`: You can get the current cards in your hand.

2. The endpoints of the system are available in the postman collection.
3. The endpoints are documented with Open API / swagger. To use the swagger UI you must run the system and go to `/api-docs`

## API structure
```json
{
  "swagger": "2.0",
  "info": {
    "title": "API for UNO game",
    "description": "API to handle the backend system of UNO game",
    "version": "1.0.0"
  },
  "paths": {
    "/players/me": {
      "get": {
        "tags": [
          "Players"
        ],
        "description": "Get a the profile of a player by its jwt token",
        "parameters": [
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/players/{id}": {
      "get": {
        "tags": [
          "Players"
        ],
        "description": "Get a specific a player by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/players": {
      "put": {
        "tags": [
          "Players"
        ],
        "description": "Update a specific player",
        "parameters": [
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Update a player",
            "schema": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "example": "string"
                },
                "age": {
                  "type": "number",
                  "example": 0
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Players"
        ],
        "description": "Remove a specific a player by its jwt token",
        "parameters": [
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{id}/status": {
      "get": {
        "tags": [
          "Games"
        ],
        "description": "Get the status of a game by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/games/{id}": {
      "get": {
        "tags": [
          "Games"
        ],
        "description": "Get a specific game by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      },
      "put": {
        "tags": [
          "Games"
        ],
        "description": "Update a specific game",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Update a game",
            "schema": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string",
                  "example": "string"
                },
                "maxPlayers": {
                  "type": "number",
                  "example": 2
                },
                "rules": {
                  "type": "object",
                  "properties": {
                    "allowDrawFour": {
                      "type": "boolean",
                      "example": true
                    },
                    "allowAccumulateDraw": {
                      "type": "boolean",
                      "example": false
                    },
                    "allowReverse": {
                      "type": "boolean",
                      "example": true
                    }
                  }
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Games"
        ],
        "description": "Remove a specific game by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games": {
      "post": {
        "tags": [
          "Games"
        ],
        "description": "Add a new game",
        "parameters": [
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Add a game",
            "schema": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string",
                  "example": "string"
                },
                "maxPlayers": {
                  "type": "number",
                  "example": 2
                },
                "rules": {
                  "type": "object",
                  "properties": {
                    "allowDrawFour": {
                      "type": "boolean",
                      "example": true
                    },
                    "allowAccumulateDraw": {
                      "type": "boolean",
                      "example": false
                    },
                    "allowReverse": {
                      "type": "boolean",
                      "example": true
                    }
                  }
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{id}/start": {
      "put": {
        "tags": [
          "Games"
        ],
        "description": "Start a specific game by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{id}/end": {
      "put": {
        "tags": [
          "Games"
        ],
        "description": "finish a specific game by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/cards/initialize": {
      "post": {
        "tags": [
          "Cards"
        ],
        "description": "Initialize the cards of the original game",
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/cards": {
      "get": {
        "tags": [
          "Cards"
        ],
        "description": "Get all cards",
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/cards/{id}": {
      "get": {
        "tags": [
          "Cards"
        ],
        "description": "Get a specific card based on the ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/games/{gameId}/cards": {
      "post": {
        "tags": [
          "GameCards"
        ],
        "description": "Initialize the cards that will use a specific game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      },
      "get": {
        "tags": [
          "GameCards"
        ],
        "description": "Get all the cards that compose a game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/cards/top-card": {
      "get": {
        "tags": [
          "GameCards"
        ],
        "description": "Get the top card of the discard from a specific game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/games/{gameId}/cards/hand": {
      "get": {
        "tags": [
          "GameCards"
        ],
        "description": "Get the hand of a player in a specific game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/games/{gameId}/cards/{cardId}": {
      "put": {
        "tags": [
          "GameCards"
        ],
        "description": "Update a specific card in the game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "cardId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Update card in a game",
            "schema": {
              "type": "object",
              "properties": {
                "zone": {
                  "type": "string",
                  "example": "string"
                },
                "position": {
                  "type": "number",
                  "example": 0
                },
                "playerId": {
                  "type": "string",
                  "example": "string"
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/scores/{id}": {
      "get": {
        "tags": [
          "Scores"
        ],
        "description": "Get a specific a score by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      },
      "put": {
        "tags": [
          "Scores"
        ],
        "description": "Update a specific a score by its ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Update a score",
            "schema": {
              "type": "object",
              "properties": {
                "score": {
                  "type": "number",
                  "example": 0
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/scores/games/{gameId}": {
      "get": {
        "tags": [
          "Scores"
        ],
        "description": "Get a the scores of the players in a specific game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/games/{gameId}/players": {
      "post": {
        "tags": [
          "GamePlayers"
        ],
        "description": "Add a new player in a game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      },
      "delete": {
        "tags": [
          "GamePlayers"
        ],
        "description": "Remove player from a game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      },
      "get": {
        "tags": [
          "GamePlayers"
        ],
        "description": "Get the players that are in a game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/games/{gameId}/players/current": {
      "get": {
        "tags": [
          "GamePlayers"
        ],
        "description": "Get the current player in the turn to play",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/auth/register": {
      "post": {
        "tags": [
          "Auth"
        ],
        "description": "Register a new player",
        "parameters": [
          {
            "name": "body",
            "in": "body",
            "description": "add a player",
            "schema": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "example": "string"
                },
                "age": {
                  "type": "number",
                  "example": 0
                },
                "email": {
                  "type": "string",
                  "example": "string"
                },
                "password": {
                  "type": "string",
                  "example": "string"
                }
              }
            }
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": [
          "Auth"
        ],
        "description": "authenticate a player using its email and password",
        "parameters": [
          {
            "name": "body",
            "in": "body",
            "description": "authenticate player",
            "schema": {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string",
                  "example": "string"
                },
                "password": {
                  "type": "string",
                  "example": "string"
                }
              }
            }
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    },
    "/auth/logout": {
      "post": {
        "tags": [
          "Auth"
        ],
        "description": "logout a player using its token",
        "parameters": [
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/distribute": {
      "post": {
        "tags": [
          "GameEngine"
        ],
        "description": "Distribute the cards in a game between the players",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "distribute cards",
            "schema": {
              "type": "object",
              "properties": {
                "cardsPerPlayer": {
                  "type": "number",
                  "example": 0
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/play": {
      "put": {
        "tags": [
          "GameEngine"
        ],
        "description": "Play a card from the hand. Put a color if the card is multicolor",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Play a card",
            "schema": {
              "type": "object",
              "properties": {
                "cardId": {
                  "type": "string",
                  "example": "string"
                },
                "newColor": {
                  "type": "string",
                  "example": "string"
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/draw": {
      "put": {
        "tags": [
          "GameEngine"
        ],
        "description": "Draw a card from the deck.",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/say-uno": {
      "patch": {
        "tags": [
          "GameEngine"
        ],
        "description": "Say uno.",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/challenge": {
      "post": {
        "tags": [
          "GameEngine"
        ],
        "description": "Challenge another player when he has not said uno",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "authorization",
            "in": "header",
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "description": "Challenge a player",
            "schema": {
              "type": "object",
              "properties": {
                "challengedPlayerId": {
                  "type": "string",
                  "example": "string"
                }
              }
            }
          }
        ],
        "responses": {
          "401": {
            "description": "Unauthorized"
          }
        },
        "security": [
          {
            "apiKeyAuth": []
          }
        ]
      }
    },
    "/games/{gameId}/history": {
      "get": {
        "tags": [
          "History"
        ],
        "description": "get the history of a game",
        "parameters": [
          {
            "name": "gameId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "default": {
            "description": ""
          }
        }
      }
    }
  }
}
```

## Contributors
1. Luis Eduardo Barajas
## Version
1.0.0
## Author
Luis Eduardo Barajas
## Status
This project is still in the development phase. 
