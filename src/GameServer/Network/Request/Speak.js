const ServerResponse = invoke('GameServer/Network/Response');
const ReceivePacket  = invoke('Packet/Receive');

function speak(session, buffer) {
    let packet = new ReceivePacket(buffer);

    packet
        .readS()  // Text
        .readD(); // Kind

    consume(session, {
        text: packet.data[0],
        kind: packet.data[1],
    });
}

function consume(session, data) {
    if (data.kind === 0) { // TODO: Remove, temp solution
        if (data.text === '.admin') {
            invoke(path.actor).adminPanel(session, session.actor);
            return;
        }
        if (data.text === '.sell') {
            invoke(path.world + 'NpcTalkResponse')(session, { link: 'sell-junk' });
            return;
        }
        if (data.text === '.leave') {
            const World = invoke('GameServer/World/World');
            World.dismissParty(session, session.actor);
            return;
        }
        if (data.text.startsWith('.kick ')) {
            const name = data.text.substring(6).trim();
            const World = invoke('GameServer/World/World');
            World.oustPartyMember(session, session.actor, { name: name });
            return;
        }
    }

    session.dataSendToMeAndOthers(ServerResponse.speak(session.actor, data), session.actor);

    try {
        const BotManager = invoke('GameServer/Bot/BotManager');
        if (BotManager && typeof BotManager.handlePlayerSpeak === 'function') {
            BotManager.handlePlayerSpeak(session, data);
        }
    } catch (err) {
        console.error("BotManager speak hook error:", err);
    }
}

module.exports = speak;
