const { Writable } = require('stream');
const winston = require('winston');

const createDbTransport = (logRepository, { level = 'info' } = {}) => {
  const stream = new Writable({
    objectMode: true,
    write(info, _enc, done) {
      const { level, message, category, event, source, statusCode, playerId, gameId, stack, ...metadata } = info;
      logRepository
        .create({ level, category: category ?? 'SYSTEM', event: event ?? 'LOG', message: stack ?? message,
                  source, statusCode, playerId, gameId, metadata })
        .catch((e) => console.error('event log not persisted:', e.message))
        .finally(done);
    },
  });
  return new winston.transports.Stream({ stream, level });
};

module.exports = createDbTransport;