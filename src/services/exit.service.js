// This file has the objective of close the server in an orderly manner
// The following resources will be closed:
// Players: All the players that are currently connected will update their status to OFFLINE

const createExitService = (
    playerRegistry,
    playerRepository
) => {
    const cleanup = async () => {
        await logoutPlayers();
    }

    async function logoutPlayers() {
        const playersId = playerRegistry.getOnlinePlayers();
        await Promise.all(
            playersId.map(async id => {
                await playerRepository.update(id, { status: 'OFFLINE' });
            })
        );
    }

    process.on('SIGINT', async () => {
        console.log('SIGNINT RECEIVED, CLOSING SERVER...');
        await cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('SIGTERM RECEIVED, CLOSING SERVER...');
        await cleanup();    
        process.exit(0);
    });
}

module.exports = createExitService;