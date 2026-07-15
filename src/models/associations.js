const Player = require('./player.model');
const Game = require('./game.model');


Game.belongsTo(Player, { as: 'owner', foreignKey: 'ownerId'});
Game.belongsTo(Player, { as: 'winner', foreignKey: 'winnerId'});
Game.belongsToMany(Player, {through: 'PlayerGame', as: 'players'});

Player.hasMany(Game, { as: 'ownGames', foreignKey: 'ownerId'});
Player.hasMany(Game, { as: 'winnedGames', foreignKey: 'winnerId'});
Player.belongsToMany(Game, {through: 'PlayerGame'});

module.exports = {
    Game,
    Player
}