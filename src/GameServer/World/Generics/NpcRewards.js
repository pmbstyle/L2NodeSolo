const DataCache = invoke('GameServer/DataCache');
const SpeckMath = invoke('GameServer/SpeckMath');
const Database  = invoke('Database');

function npcRewards(session, npc) {
    DataCache.fetchNpcRewardsFromSelfId(npc.fetchSelfId(), (result) => {
        const rewards = result.rewards ?? [];
        const optn    = options.default.General;

        rewards.forEach((reward) => {
            if (Math.random() * 100 <= reward.overall * optn.dropChanceRate) {
                let number = Math.random() * 100;
                let rewardPartition = 0;

                for (const item of reward.items) {
                    rewardPartition += item.chance;

                    if (number <= rewardPartition) { // TODO: Remove locZ hack at some point
                        const amount = utils.oneFromSpan(item.min, item.max);
                        if (session && (session.constructor.name === 'BotSession' || (session.accountId && session.accountId.startsWith('bot_')))) {
                            const backpack = session.actor.backpack;
                            backpack.stackableExists(item.selfId).then((existingItem) => {
                                const total = existingItem.fetchAmount() + amount;
                                Database.updateItemAmount(session.actor.fetchId(), existingItem.fetchId(), total).then(() => {
                                    existingItem.setAmount(total);
                                });
                            }).catch(() => {
                                DataCache.fetchItemFromSelfId(item.selfId, (itemDetails) => {
                                    Database.setItem(session.actor.fetchId(), {
                                        selfId: itemDetails.selfId,
                                        name: itemDetails.template.name,
                                        amount: amount,
                                        equipped: false,
                                        slot: itemDetails.etc?.slot ?? 0
                                    }).then((packet) => {
                                        backpack.insertItem(Number(packet.insertId), itemDetails.selfId, { amount: amount });
                                    });
                                });
                            });
                        } else {
                            let point = new SpeckMath.Circle(npc.fetchLocX(), npc.fetchLocY(), 50).createPointWithin();
                            this.spawnItem(session, item.selfId, amount, {
                                ...point.toCoords(), locZ: npc.fetchLocZ() - 10
                            });
                        }
                        break;
                    }
                }
            }
        });
    });
}

module.exports = npcRewards;
