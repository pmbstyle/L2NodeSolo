const World         = invoke('GameServer/World/World');
const ReceivePacket = invoke('Packet/Receive');

function oustPartyMember(session, buffer) {
    const packet = new ReceivePacket(buffer);

    packet
        .readS(); // Name of member to oust

    consume(session, {
        name: packet.data[0],
    });
}

function consume(session, data) {
    World.oustPartyMember(session, session.actor, data);
}

module.exports = oustPartyMember;
