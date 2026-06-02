const World = invoke('GameServer/World/World');

function skillExec(session, actor, data) {
    const skill = actor.skillset.fetchSkill(data.selfId);
    if (!skill) return;

    World.fetchNpc(data.id).then((npc) => {
        actor.automation.scheduleAction(session, actor, npc, skill.fetchDistance(), () => {
            if (npc.fetchAttackable() || data.ctrl) {
                actor.attack.remoteHit(session, npc, skill);
            }
        });
    }).catch(() => {
        World.fetchUser(data.id).then((user) => {
            actor.automation.scheduleAction(session, actor, user, skill.fetchDistance(), () => {
                if (data.ctrl) {
                    actor.attack.remoteHit(session, user, skill);
                }
            });
        }).catch((err) => {
            utils.infoWarn('GameServer', 'Skill -> ' + err);
        });
    });
}

module.exports = skillExec;
