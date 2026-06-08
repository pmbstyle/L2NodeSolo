const ServerResponse = invoke('GameServer/Network/Response');
const DataCache      = invoke('GameServer/DataCache');
const Database       = invoke('Database');

function fold(v) {
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function buildShopHtml(session, bot) {
    const store = bot.fetchPrivateStore();
    const items = store ? store.items : [];
    const adena = session.actor.backpack.fetchTotalAdena();
    const title = store?.title ?? 'Merchant';

    let rows = '';
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const template = DataCache.items.find(ob => ob.selfId === item.selfId);
        const iname = template?.template?.name ?? 'Unknown';
        const icat = template?.template?.kind ?? '';
        const clr = icat.startsWith('Weapon') ? 'FF9900' :
                    icat.startsWith('Armor') || icat.startsWith('Shield') ? '99CCFF' : 'LEVEL';

        const c = item.count;
        let buys = `<a action="bypass -h buy-merchant-item ${item.selfId} 1"><font color="FFCC00">x1</font></a>&nbsp;&nbsp;`;
        if (c >= 10) buys += `<a action="bypass -h buy-merchant-item ${item.selfId} 10"><font color="FFCC00">x10</font></a>&nbsp;&nbsp;`;
        if (c >= 100) buys += `<a action="bypass -h buy-merchant-item ${item.selfId} 100"><font color="FFCC00">x100</font></a>&nbsp;&nbsp;`;
        if (c > 1) buys += `<a action="bypass -h buy-merchant-item ${item.selfId} ${c}"><font color="FFCC00">All</font></a>`;

        rows += `<table width=270><tr><td><font color="${clr}">${iname}</font></td></tr></table>`;
        rows += `<table width=270><tr><td width=80>Stock: <font color="99CCFF">${fold(c)}</font></td>`;
        rows += `<td width=80 align=right>Price: <font color="00FF00">${fold(item.price)}a</font></td>`;
        rows += `<td width=110 align=right>${buys}</td></tr></table>`;
        if (i < items.length - 1) rows += `<br1><img src="L2UI_CH3.hegaerectangle" width=270 height=1><br1>`;
    }

    return `<html><body>
<center>
<font color="FFCC00">${title}</font><br1>
<font color="00FF00">Adena: ${fold(adena)}a</font><br>
<img src="L2UI_CH3.hegaerectangle" width=270 height=1><br1>
${rows}
<br>
<a action="bypass -h npc_talk">Close</a>
</center></body></html>`;
}

function deductAdena(session, amount) {
    const actor = session.actor;
    const backpack = actor.backpack;
    return new Promise((resolve, reject) => {
        const adenaItem = backpack.fetchItemFromSelfId(57);
        if (!adenaItem || adenaItem.fetchAmount() < amount) {
            return reject("Not enough Adena.");
        }
        const total = adenaItem.fetchAmount() - amount;
        if (total > 0) {
            Database.updateItemAmount(actor.fetchId(), adenaItem.fetchId(), total).then(() => {
                adenaItem.setAmount(total);
                resolve();
            }).catch(reject);
        } else {
            Database.deleteItem(actor.fetchId(), adenaItem.fetchId()).then(() => {
                backpack.items = backpack.items.filter(ob => ob.fetchId() !== adenaItem.fetchId());
                resolve();
            }).catch(reject);
        }
    });
}

function giveItem(session, selfId, amount) {
    const actor = session.actor;
    const backpack = actor.backpack;
    return new Promise((resolve) => {
        backpack.stackableExists(selfId).then((item) => {
            const itemId = item.fetchId();
            const total = item.fetchAmount() + amount;
            Database.updateItemAmount(actor.fetchId(), itemId, total).then(() => {
                backpack.updateAmount(itemId, total);
                resolve();
            });
        }).catch(() => {
            DataCache.fetchItemFromSelfId(selfId, (item) => {
                Database.setItem(actor.fetchId(), {
                    selfId: item.selfId,
                    name: item.template.name,
                    amount: amount,
                    equipped: false,
                    slot: item.etc.slot
                }).then((packet) => {
                    backpack.insertItem(Number(packet.insertId), selfId, { amount: amount });
                    resolve();
                });
            });
        });
    });
}

module.exports = async function(session, parts) {
    const bot = session.viewedPrivateStoreSeller;
    if (!bot) {
        session.dataSendToMe(ServerResponse.speak(session.actor, { kind: 0, text: "No merchant selected." }));
        return;
    }

    const store = bot.fetchPrivateStore();
    if (!store || store.storeType !== 1 || !store.items.length) {
        session.dataSendToMe(ServerResponse.speak(session.actor, { kind: 0, text: "This merchant has nothing for sale." }));
        return;
    }

    if (parts.length < 2) {
        session.dataSendToMe(ServerResponse.npcHtml(bot.fetchId(), buildShopHtml(session, bot)));
        return;
    }

    const selfId = parseInt(parts[1]);
    const rawQty = parseInt(parts[2]);
    const qty = isNaN(rawQty) || rawQty < 1 ? 1 : rawQty;

    const storeItem = store.items.find(i => i.selfId === selfId);
    if (!storeItem) {
        session.dataSendToMe(ServerResponse.npcHtml(bot.fetchId(), buildShopHtml(session, bot)));
        return;
    }

    const buyQty = Math.min(qty, storeItem.count);
    if (buyQty <= 0) return;

    const totalCost = storeItem.price * buyQty;
    const playerAdena = session.actor.backpack.fetchTotalAdena();
    if (playerAdena < totalCost) {
        session.dataSendToMe(ServerResponse.speak(session.actor, { kind: 0, text: "You do not have enough Adena." }));
        return;
    }

    try {
        await deductAdena(session, totalCost);
        await giveItem(session, selfId, buyQty);

        storeItem.count -= buyQty;
        if (storeItem.count <= 0) {
            store.items = store.items.filter(i => i.count > 0);
        }

        session.dataSendToMe(ServerResponse.userInfo(session.actor));
        session.dataSendToMe(ServerResponse.itemsList(session.actor.backpack.fetchItems()));
        session.dataSendToMe(ServerResponse.npcHtml(bot.fetchId(), buildShopHtml(session, bot)));
    } catch (err) {
        utils.infoWarn("BuyMerchantItem", "purchase error: " + err);
        session.dataSendToMe(ServerResponse.actionFailed());
        session.dataSendToMe(ServerResponse.npcHtml(bot.fetchId(), buildShopHtml(session, bot)));
    }
};
