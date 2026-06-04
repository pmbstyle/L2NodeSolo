const SendPacket = invoke('Packet/Send');

function relationChanged(actor) {
    const packet = new SendPacket(0xce);

    packet
        .writeD(actor.fetchId())
        .writeD(0x00) // relation
        .writeD((actor.fetchKarma() > 0 || actor.fetchPvpFlag() > 0) ? 1 : 0) // autoattackable
        .writeD(actor.fetchKarma())
        .writeD(actor.fetchPvpFlag());

    return packet.fetchBuffer();
}

module.exports = relationChanged;
