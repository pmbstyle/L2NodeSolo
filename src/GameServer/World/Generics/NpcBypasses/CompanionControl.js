const BotManager = invoke('GameServer/Bot/BotManager');
const ServerResponse = invoke('GameServer/Network/Response');
const TeleportTo = invoke('GameServer/Actor/Generics/TeleportTo');

function companionControl(session, parts) {
    const actor = session.actor;
    if (!actor || actor.isDead()) return;

    // Command parameters format:
    // companion-control <subcommand> <botname>
    const subCommand = parts[1];

    if (subCommand && subCommand !== 'refresh') {
        const botName = parts[2];
        if (botName) {
            const targetSession = BotManager.sessions.find(s => s.actor && s.actor.fetchName().toLowerCase() === botName.toLowerCase());
            
            if (targetSession && targetSession.followPlayerSession === session) {
                const bot = targetSession.actor;
                
                if (subCommand === 'follow') {
                    targetSession.botStay = false;
                    targetSession.stayLocation = null;
                    BotManager.botSay(targetSession, "Following you again!");
                }
                else if (subCommand === 'stay') {
                    targetSession.botStay = true;
                    targetSession.stayLocation = {
                        locX: bot.fetchLocX(),
                        locY: bot.fetchLocY(),
                        locZ: bot.fetchLocZ()
                    };
                    BotManager.botSay(targetSession, "Holding this position.");
                }
                else if (subCommand === 'taunt-on') {
                    targetSession.autoTaunt = true;
                    BotManager.botSay(targetSession, "Auto-taunt enabled. I will pull monsters.");
                }
                else if (subCommand === 'taunt-off') {
                    targetSession.autoTaunt = false;
                    BotManager.botSay(targetSession, "Auto-taunt disabled.");
                }
                else if (subCommand === 'summon') {
                    TeleportTo(targetSession, bot, {
                        locX: actor.fetchLocX() + 60,
                        locY: actor.fetchLocY() + 60,
                        locZ: actor.fetchLocZ()
                    });
                    if (targetSession.botStay) {
                        targetSession.stayLocation = {
                            locX: actor.fetchLocX() + 60,
                            locY: actor.fetchLocY() + 60,
                            locZ: actor.fetchLocZ()
                        };
                    }
                    BotManager.botSay(targetSession, "Summoned to your side!");
                }
                else if (subCommand === 'dismiss') {
                    session.dataSendToMe(ServerResponse.partySmallWindowDelete(bot.fetchId(), bot.fetchName()));
                    setTimeout(() => {
                        BotManager.botSay(targetSession, "Leaving the group. Goodbye!");
                        targetSession.plan = 'hunting';
                        targetSession.followPlayerSession = null;
                        targetSession.botStay = false;
                        targetSession.stayLocation = null;
                    }, 1000);
                }
            }
        }
    }

    // Always redraw the panel
    renderCompanionPanel(session);
}

function renderCompanionPanel(session) {
    const actor = session.actor;
    if (!actor) return;

    // Find all bot sessions following this player
    const myCompanions = BotManager.sessions.filter(s => s.followPlayerSession === session && s.actor);

    if (myCompanions.length === 0) {
        const html = `<html><body><font color="LEVEL">Companion Panel</font><br><br>You currently have no companions in your party.<br>Target a bot and type <font color="LEVEL">/invite</font> to recruit them!</body></html>`;
        session.dataSendToMe(ServerResponse.npcHtml(actor.fetchId(), html));
        return;
    }

    let html = `<html><body><font color="LEVEL">Companion Control Panel</font><br><br>`;
    html += `<img src="L2UI.SquareWhite" width=270 height=1><br>`;

    myCompanions.forEach((companionSession) => {
        const bot = companionSession.actor;
        const classId = bot.fetchClassId();
        const hpPercent = Math.round((bot.fetchHp() / bot.fetchMaxHp()) * 100);
        const mpPercent = Math.round((bot.fetchMp() / bot.fetchMaxMp()) * 100);

        html += `<font color="00FF00">${bot.fetchName()}</font> (Lvl ${bot.fetchLevel()})<br>`;
        html += `HP: ${bot.fetchHp()}/${bot.fetchMaxHp()} (${hpPercent}%) | MP: ${bot.fetchMp()}/${bot.fetchMaxMp()} (${mpPercent}%)<br>`;

        const TANK_CLASSES = [4, 5, 6, 19, 20, 32, 33];
        const isTank = TANK_CLASSES.includes(classId);

        const stayActive = companionSession.botStay === true;
        const tauntActive = companionSession.autoTaunt !== false; // default true for tanks

        // Follow / Stay buttons
        if (stayActive) {
            html += `<a action="bypass -h companion-control follow ${bot.fetchName()}"><font color="FF0000">[STAYING]</font> Click to Follow</a>`;
        } else {
            html += `<a action="bypass -h companion-control stay ${bot.fetchName()}"><font color="00FF00">[FOLLOWING]</font> Click to Stay</a>`;
        }

        // Taunt button for tanks
        if (isTank) {
            html += ` | `;
            if (tauntActive) {
                html += `<a action="bypass -h companion-control taunt-off ${bot.fetchName()}"><font color="LEVEL">[PULL: ON]</font></a>`;
            } else {
                html += `<a action="bypass -h companion-control taunt-on ${bot.fetchName()}"><font color="777777">[PULL: OFF]</font></a>`;
            }
        }

        html += `<br><a action="bypass -h companion-control summon ${bot.fetchName()}">Summon</a> | <a action="bypass -h companion-control dismiss ${bot.fetchName()}"><font color="FF5555">Dismiss</font></a><br>`;
        html += `<img src="L2UI.SquareBlank" width=270 height=8><br>`;
    });

    html += `<img src="L2UI.SquareWhite" width=270 height=1><br>`;
    html += `<table width=270><tr>`;
    html += `<td width=135><a action="bypass -h companion-control refresh">Refresh Status</a></td>`;
    html += `<td width=135 align=right><a action="bypass -h html 7000">Close</a></td>`;
    html += `</tr></table>`;
    html += `</body></html>`;

    session.dataSendToMe(ServerResponse.npcHtml(actor.fetchId(), html));
}

companionControl.render = renderCompanionPanel;

module.exports = companionControl;
