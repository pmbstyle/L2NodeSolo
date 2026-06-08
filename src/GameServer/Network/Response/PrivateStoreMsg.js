const SendPacket = invoke('Packet/Send');

function privateStoreMsg(actor, storeTitle) {
    const packet = new SendPacket(0x8c);
    packet.writeD(actor.fetchId());
    packet.writeS(storeTitle ?? actor.fetchTitle());
    return packet.fetchBuffer();
}

module.exports = privateStoreMsg;
