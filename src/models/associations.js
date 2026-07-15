const Player = require('./player.model');
const Game = require('./game.model');
const Card = require('./card.model');
const GameCard = require('./game-card.model');

Game.belongsTo(Player, { as: 'owner', foreignKey: 'ownerId'});
Game.belongsTo(Player, { as: 'winner', foreignKey: 'winnerId'});
Game.belongsToMany(Player, {through: 'PlayerGame', as: 'players'});
Game.belongsToMany(Card, {through: GameCard, as: 'cards'});

Player.hasMany(Game, { as: 'ownGames', foreignKey: 'ownerId'});
Player.hasMany(Game, { as: 'winnedGames', foreignKey: 'winnerId'});
Player.belongsToMany(Game, {through: 'PlayerGame'});
Player.hasMany(GameCard, { as: 'cardsInHand'});

Card.belongsTo(Player);
Card.belongsToMany(Game, {through: GameCard})

module.exports = {
    Game,
    Player
}