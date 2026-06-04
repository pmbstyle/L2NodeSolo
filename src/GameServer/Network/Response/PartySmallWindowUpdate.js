const SendPacket = invoke('Packet/Send');

function partySmallWindowUpdate(member) {
    const packet = new SendPacket(0x52); // Opcode 0x52

    const id = member.fetchId();
    const name = member.fetchName();
    const hp = Math.round(member.fetchHp());
    const maxHp = Math.round(member.fetchMaxHp());
    const mp = Math.round(member.fetchMp());
    const maxMp = Math.round(member.fetchMaxMp());
    const lvl = member.fetchLevel();
    const classId = member.fetchClassId();

    // Format is "dSdddddd"
    packet
        .writeD(id)
        .writeS(name)
        .writeD(hp)
        .writeD(maxHp)
        .writeD(mp)
        .writeD(maxMp)
        .writeD(lvl)
        .writeD(classId);

    return packet.fetchBuffer();
}

module.exports = partySmallWindowUpdate;
