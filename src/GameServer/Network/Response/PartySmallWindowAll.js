const SendPacket = invoke('Packet/Send');

function partySmallWindowAll(partyLeaderId, distribution, members) {
    const packet = new SendPacket(0x4e); // Opcode 0x4e

    // Header has only 1 dword in C2: members.length
    packet.writeD(members.length);

    members.forEach((member) => {
        const id = member.fetchId();
        const name = member.fetchName();
        const hp = Math.round(member.fetchHp());
        const maxHp = Math.round(member.fetchMaxHp());
        const mp = Math.round(member.fetchMp());
        const maxMp = Math.round(member.fetchMaxMp());
        const lvl = member.fetchLevel();
        const classId = member.fetchClassId();

        // Each member tuple matches format "dSdddddddd" (10 fields)
        packet
            .writeD(id)        // 1: id
            .writeS(name)      // 2: name
            .writeD(hp)        // 3: hp
            .writeD(maxHp)     // 4: maxHp
            .writeD(mp)        // 5: mp
            .writeD(maxMp)     // 6: maxMp
            .writeD(lvl)       // 7: lvl
            .writeD(classId)   // 8: classId
            .writeD(0)         // 9: has pet (0 = no)
            .writeD(0);        // 10: pet template/object ID
    });

    return packet.fetchBuffer();
}

module.exports = partySmallWindowAll;
