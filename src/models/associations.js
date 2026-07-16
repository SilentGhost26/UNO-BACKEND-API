const Player = require('./player.model');
const Game = require('./game.model');
const Card = require('./card.model');
const GameCard = require('./game-card.model');

Game.belongsTo(Player, { as: 'owner', foreignKey: 'ownerId'});
Game.belongsTo(Player, { as: 'winner', foreignKey: 'winnerId'});
Game.belongsToMany(Player, {through: 'PlayerGame', as: 'players'});
Game.hasMany(GameCard, { as: 'cards', foreignKey: 'gameId'});

Player.hasMany(Game, { as: 'ownGames', foreignKey: 'ownerId'});
Player.hasMany(Game, { as: 'wonGames', foreignKey: 'winnerId'});
Player.belongsToMany(Game, {through: 'PlayerGame', as: 'matchedGames'});
Player.hasMany(GameCard, { as: 'cardsInHand', foreignKey: 'playerId' });

GameCard.belongsTo(Player, { foreignKey: 'playerId'});
GameCard.belongsTo(Card, { foreignKey: 'cardId'});
GameCard.belongsTo(Game, { foreignKey: 'gameId'});

Card.hasMany(GameCard, {foreignKey: 'cardId'})

module.exports = {
    Game,
    Player,
    Card,
    GameCard
}