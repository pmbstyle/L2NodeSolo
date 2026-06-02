const SpeckMath      = invoke('GameServer/SpeckMath');
const World          = invoke('GameServer/World/World');
const ServerResponse = invoke('GameServer/Network/Response');

module.exports = {
    tick(session, bot, Generics, BotAI) {
        const playerSession = session.followPlayerSession;
        if (!playerSession || !playerSession.actor || !playerSession.actor.fetchIsOnline()) {
            session.plan = 'hunting';
            BotAI.say(session, "My companion has disconnected. Heading back to hunt.");
            return;
        }

        const player = playerSession.actor;
        const distance = new SpeckMath.Point3D(bot.fetchLocX(), bot.fetchLocY(), bot.fetchLocZ())
            .distance(new SpeckMath.Point3D(player.fetchLocX(), player.fetchLocY(), player.fetchLocZ()));

        if (distance > 3500) {
            session.plan = 'hunting';
            BotAI.say(session, "You ran too far away! I'm going back to hunt on my own.");
            return;
        }

        // 1. HP/MP resting check for companion bots
        const hpRatio = bot.fetchHp() / bot.fetchMaxHp();
        const mpRatio = bot.fetchMp() / bot.fetchMaxMp();
        if (hpRatio < 0.30 || mpRatio < 0.15) {
            session.plan = 'resting';
            session.currentTargetId = undefined;
            bot.unselect();
            bot.state.setSeated(true);
            session.dataSendToOthers(ServerResponse.sitAndStand(bot), bot);
            BotAI.say(session, "Phew! My HP/MP is low. Sitting down to recover.");
            return;
        }

        const classId = bot.fetchClassId();
        const HEALER_CLASSES = [15, 16, 17, 29, 30, 42, 43];
        const TANK_CLASSES = [4, 5, 6, 19, 20, 32, 33];

        let acted = false;

        // 2. Execute Healer Role: Heal leader if HP < 70%, heal self if HP < 60%
        if (HEALER_CLASSES.includes(classId)) {
            const leaderHpRatio = player.fetchHp() / player.fetchMaxHp();
            if (leaderHpRatio < 0.70) {
                const SkillModel = invoke('GameServer/Model/Skill');
                let skill = bot.skillset.fetchSkill(1011);
                if (!skill) {
                    skill = new SkillModel({
                        selfId: 1011,
                        name: "Heal",
                        level: 1,
                        hp: 0,
                        mp: 15,
                        hitTime: 1500,
                        reuse: 1000,
                        power: 20,
                        distance: 600,
                        passive: false
                    });
                    bot.skillset.skills.push(skill);
                }
                if (bot.fetchMp() >= skill.fetchConsumedMp()) {
                    acted = true;
                    if (!(bot.state.fetchTowards() || bot.state.fetchHits() || bot.state.fetchCasts())) {
                        session.currentTargetId = player.fetchId();
                        bot.select({ id: player.fetchId() });
                        Generics.skillExec(session, bot, { id: player.fetchId(), selfId: 1011, ctrl: false });
                        if (Math.random() < 0.15) {
                            BotAI.say(session, "Healing you, " + player.fetchName() + "!");
                        }
                    }
                }
            } else if (hpRatio < 0.60) {
                const SkillModel = invoke('GameServer/Model/Skill');
                let skill = bot.skillset.fetchSkill(1011);
                if (!skill) {
                    skill = new SkillModel({
                        selfId: 1011,
                        name: "Heal",
                        level: 1,
                        hp: 0,
                        mp: 15,
                        hitTime: 1500,
                        reuse: 1000,
                        power: 20,
                        distance: 600,
                        passive: false
                    });
                    bot.skillset.skills.push(skill);
                }
                if (bot.fetchMp() >= skill.fetchConsumedMp()) {
                    acted = true;
                    if (!(bot.state.fetchTowards() || bot.state.fetchHits() || bot.state.fetchCasts())) {
                        session.currentTargetId = bot.fetchId();
                        bot.select({ id: bot.fetchId() });
                        Generics.skillExec(session, bot, { id: bot.fetchId(), selfId: 1011, ctrl: false });
                        if (Math.random() < 0.15) {
                            BotAI.say(session, "Healing myself!");
                        }
                    }
                }
            }
        }

        // 3. Execute Tank Role: Aggression on mobs attacking the leader
        if (!acted && TANK_CLASSES.includes(classId)) {
            const nearbyNpcs = World.fetchNpcsInRadius(bot.fetchLocX(), bot.fetchLocY(), 800);
            let monsterToAggro = null;
            for (const npc of nearbyNpcs) {
                if (npc.fetchAttackable() && !npc.isDead() && npc.fetchDestId() === player.fetchId()) {
                    monsterToAggro = npc;
                    break;
                }
            }

            if (monsterToAggro) {
                const SkillModel = invoke('GameServer/Model/Skill');
                let skill = bot.skillset.fetchSkill(28);
                if (!skill) {
                    skill = new SkillModel({
                        selfId: 28,
                        name: "Aggression",
                        level: 1,
                        hp: 0,
                        mp: 10,
                        hitTime: 1000,
                        reuse: 3000,
                        power: 0,
                        distance: 600,
                        passive: false
                    });
                    bot.skillset.skills.push(skill);
                }
                if (bot.fetchMp() >= skill.fetchConsumedMp()) {
                    acted = true;
                    if (!(bot.state.fetchTowards() || bot.state.fetchHits() || bot.state.fetchCasts())) {
                        session.currentTargetId = monsterToAggro.fetchId();
                        bot.select({ id: monsterToAggro.fetchId() });
                        Generics.skillExec(session, bot, { id: monsterToAggro.fetchId(), selfId: 28, ctrl: true });
                        if (Math.random() < 0.20) {
                            BotAI.say(session, "Hey, " + monsterToAggro.fetchName() + "! Attack me instead!");
                        }
                    }
                }
            }
        }

        // 3.5 Execute Tank Pulling if out of combat, following, and autoTaunt is enabled
        if (!acted && !session.currentTargetId && !session.botStay && TANK_CLASSES.includes(classId) && session.autoTaunt !== false) {
            const nearbyNpcs = World.fetchNpcsInRadius(player.fetchLocX(), player.fetchLocY(), 1200);
            let targetMonster = null;
            let closestDist = 1200;

            for (const npc of nearbyNpcs) {
                if (npc.fetchAttackable() && !npc.isDead() && npc.fetchDestId() === undefined) {
                    const distToBot = new SpeckMath.Point3D(bot.fetchLocX(), bot.fetchLocY(), bot.fetchLocZ())
                        .distance(new SpeckMath.Point3D(npc.fetchLocX(), npc.fetchLocY(), npc.fetchLocZ()));
                    if (distToBot < closestDist) {
                        closestDist = distToBot;
                        targetMonster = npc;
                    }
                }
            }

            if (targetMonster) {
                const SkillModel = invoke('GameServer/Model/Skill');
                let skill = bot.skillset.fetchSkill(28);
                if (!skill) {
                    skill = new SkillModel({
                        selfId: 28,
                        name: "Aggression",
                        level: 1,
                        hp: 0,
                        mp: 10,
                        hitTime: 1000,
                        reuse: 3000,
                        power: 0,
                        distance: 600,
                        passive: false
                    });
                    bot.skillset.skills.push(skill);
                }
                if (bot.fetchMp() >= skill.fetchConsumedMp()) {
                    acted = true;
                    session.currentTargetId = targetMonster.fetchId();
                    bot.select({ id: targetMonster.fetchId() });
                    Generics.skillExec(session, bot, { id: targetMonster.fetchId(), selfId: 28, ctrl: true });
                    if (Math.random() < 0.30) {
                        BotAI.say(session, "Pulling " + targetMonster.fetchName() + " to the group!");
                    }
                }
            }
        }

        // 4. Execute Combat Support (DPS / Assist)
        if (!acted) {
            const playerTargetId = player.fetchDestId();
            if (playerTargetId) {
                World.fetchUser(playerTargetId).then((user) => {
                    if (!user.state.fetchDead()) {
                        // Stay post validation: restrict target engagement
                        if (session.botStay && session.stayLocation) {
                            const stayDist = new SpeckMath.Point3D(session.stayLocation.locX, session.stayLocation.locY, session.stayLocation.locZ)
                                .distance(new SpeckMath.Point3D(user.fetchLocX(), user.fetchLocY(), user.fetchLocZ()));
                            if (stayDist > 900) {
                                return; // Too far from post
                            }
                        }

                        if (session.currentTargetId !== playerTargetId) {
                            session.currentTargetId = playerTargetId;
                            bot.select({ id: playerTargetId });
                            if (Math.random() < 0.20) {
                                BotAI.say(session, "Assisting you in PvP! Attacking " + user.fetchName() + "!");
                            }
                        }
                        if (bot.state.fetchTowards() || bot.state.fetchHits() || bot.state.fetchCasts()) {
                            return;
                        }
                        BotAI.executePvPCombat(session, bot, user, Generics);
                    } else {
                        session.currentTargetId = undefined;
                        bot.unselect();
                    }
                }).catch(() => {
                    World.fetchNpc(playerTargetId).then((npc) => {
                        if (npc.fetchAttackable() && !npc.isDead()) {
                            // Stay post validation: restrict target engagement
                            if (session.botStay && session.stayLocation) {
                                const stayDist = new SpeckMath.Point3D(session.stayLocation.locX, session.stayLocation.locY, session.stayLocation.locZ)
                                    .distance(new SpeckMath.Point3D(npc.fetchLocX(), npc.fetchLocY(), npc.fetchLocZ()));
                                if (stayDist > 900) {
                                    return; // Too far from post
                                }
                            }

                            if (session.currentTargetId !== playerTargetId) {
                                session.currentTargetId = playerTargetId;
                                bot.select({ id: playerTargetId });
                                if (Math.random() < 0.20) {
                                    BotAI.say(session, "Assisting you! Smashing that " + npc.fetchName() + "!");
                                }
                            }
                            if (bot.state.fetchTowards() || bot.state.fetchHits() || bot.state.fetchCasts()) {
                                return;
                            }
                            BotAI.executeCombat(session, bot, npc, Generics);
                        } else {
                            session.currentTargetId = undefined;
                            bot.unselect();
                        }
                    }).catch(() => {
                        session.currentTargetId = undefined;
                        bot.unselect();
                    });
                });
            } else {
                session.currentTargetId = undefined;
                bot.unselect();
            }
        }

        // 5. Follow player or return to stay location post
        if (!session.currentTargetId && !acted) {
            if (session.botStay && session.stayLocation) {
                const stayDist = new SpeckMath.Point3D(bot.fetchLocX(), bot.fetchLocY(), bot.fetchLocZ())
                    .distance(new SpeckMath.Point3D(session.stayLocation.locX, session.stayLocation.locY, session.stayLocation.locZ));
                if (stayDist > 100) {
                    bot.moveTo({
                        from: { locX: bot.fetchLocX(), locY: bot.fetchLocY(), locZ: bot.fetchLocZ() },
                        to: { locX: session.stayLocation.locX, locY: session.stayLocation.locY, locZ: session.stayLocation.locZ }
                    });
                }
            } else if (distance > 250) {
                bot.moveTo({
                    from: { locX: bot.fetchLocX(), locY: bot.fetchLocY(), locZ: bot.fetchLocZ() },
                    to: { locX: player.fetchLocX() + utils.oneFromSpan(-60, 60), locY: player.fetchLocY() + utils.oneFromSpan(-60, 60), locZ: player.fetchLocZ() }
                });
            }
        }
    }
};
