const ServerResponse = invoke('GameServer/Network/Response');

const BotMerchant = {
    talk(session, merchantBot) {
        const name = merchantBot.fetchName();
        const html = `<html><body>
        <font color="LEVEL">${name}:</font><br>
        Greetings, ${session.actor.fetchName()}! I sell resources and gear dropped by monsters in the surrounding areas of this city.<br>
        Would you like to see my goods?<br>
        <center>
            <br>
            <a action="bypass -h buy-bot-shop">Buy Local Drops</a><br>
            <a action="bypass -h sell-junk">Sell Unequipped Junk</a><br>
        </center>
        </body></html>`;

        session.dataSendToMe(
            ServerResponse.npcHtml(merchantBot.fetchId(), html)
        );
    }
};

module.exports = BotMerchant;
