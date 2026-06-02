const ReceivePacket = invoke('Packet/Receive');

function restartPoint(session, buffer) {
    const packet = new ReceivePacket(buffer);

    packet
        .readD(); // Restart point

    consume(session, {
        location: packet.data[0]
    });
}

function consume(session, data) {
    session.actor.revive();

    // Teleport resurrected players to a randomized newbie spawn coordinate of their class
    const DataCache = invoke('GameServer/DataCache');
    const classId = session.actor.fetchClassId();
    const spawns = DataCache.newbieSpawns.find(ob => ob.classId === classId)?.spawns ?? [{ locX: -84318, locY: 244579, locZ: -3730 }];
    const randomSpawn = spawns[Math.floor(Math.random() * spawns.length)];

    const targetCoord = {
        locX: randomSpawn.locX + (Math.random() - 0.5) * 600,
        locY: randomSpawn.locY + (Math.random() - 0.5) * 600,
        locZ: randomSpawn.locZ
    };

    setTimeout(() => {
        const TeleportTo = invoke('GameServer/Actor/Generics/TeleportTo');
        TeleportTo(session, session.actor, targetCoord);
    }, 2800);
}

module.exports = restartPoint;
