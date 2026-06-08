const SendPacket = invoke('Packet/Send');

function privateStoreBuyMsg(actor, storeTitle) {
    const packet = new SendPacket(0x8d);
    packet.writeD(actor.fetchId());
    packet.writeS(storeTitle ?? actor.fetchTitle());
    return packet.fetchBuffer();
}

module.exports = privateStoreBuyMsg;
