const SendPacket = invoke('Packet/Send');

function sellList(rows, adena) {
    const packet = new SendPacket(0x10);

    packet
        .writeD(adena)
        .writeD(0x00)
        .writeH(utils.size(rows));

    rows.forEach((row) => {
        const item = row.item;

        packet
            .writeH(item.fetchClass1())
            .writeD(item.fetchId())
            .writeD(item.fetchSelfId())
            .writeD(row.amount)
            .writeH(item.fetchClass2())
            .writeH(0x00);

        if (item.isWearable()) {
            packet
                .writeD(item.fetchSlot())
                .writeH(0x00)
                .writeH(0x00)
                .writeH(0x00);
        }

        packet.writeD(row.price);
    });

    return packet.fetchBuffer();
}

module.exports = sellList;
