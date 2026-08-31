const Player = require('./player.model');
const Game = require('./game.model');
const Card = require('./card.model');
const GameCard = require('./game-card.model');
const GamePlayer = require('./game-player.model');
const Rules = require('./rules.model');
const History = require('./history.model');

Game.belongsTo(Player, { as: 'owner', foreignKey: 'ownerId' });
Game.belongsTo(Player, { as: 'winner', foreignKey: 'winnerId' });
Game.hasMany(GamePlayer, {as: 'players', foreignKey: 'gameId' });
Game.hasMany(GameCard, { as: 'cards', foreignKey: 'gameId' });
Game.hasOne(Rules, { as: 'rules', foreignKey: 'gameId' });
Game.hasMany(History, { as: 'history', foreignKey: 'gameId' });

Rules.belongsTo(Game, { foreignKey: 'gameId' });

Player.hasMany(Game, { as: 'ownGames', foreignKey: 'ownerId' });
Player.hasMany(Game, { as: 'wonGames', foreignKey: 'winnerId' });
Player.hasMany(GamePlayer, { as: 'matchedGames', foreignKey: 'playerId' });
Player.hasMany(GameCard, { as: 'cardsInHand', foreignKey: 'playerId' });
Player.hasMany(History, { as: 'history', foreignKey: 'playerId' });

GameCard.belongsTo(Player, { foreignKey: 'playerId' });
GameCard.belongsTo(Card, { foreignKey: 'cardId' });
GameCard.belongsTo(Game, { foreignKey: 'gameId' });

Card.hasMany(GameCard, { foreignKey: 'cardId' });

GamePlayer.belongsTo(Game, {foreignKey: 'gameId'});
GamePlayer.belongsTo(Player, { foreignKey: 'playerId' });

History.belongsTo(Game, { foreignKey: 'gameId' });
History.belongsTo(Player, { foreignKey: 'playerId' });

module.exports = {
    Game,
    Player,
    Card,
    GameCard,
    GamePlayer,
    History,
}