const World         = invoke('GameServer/World/World');

function dismissParty(session, buffer) {
    consume(session);
}

function consume(session) {
    World.dismissParty(session, session.actor);
}

module.exports = dismissParty;
