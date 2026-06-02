module.exports = {
    tick(session, bot, Generics, BotAI) {
        if (!session.fleeStart) {
            session.fleeStart = Date.now();
        }
        // Safety fallback: if stuck in fleeing state for more than 7 seconds, recover to hunting
        if (Date.now() - session.fleeStart > 7000) {
            session.plan = 'hunting';
            session.fleeStart = undefined;
        }
    }
};
