module.exports = {
    tick(session, bot, Generics, BotAI) {
        if (!session.fleeStart) {
            session.fleeStart = Date.now();
        }
        // Safety fallback: if stuck in pk_fleeing state for more than 6 seconds, recover to pk_hunting
        if (Date.now() - session.fleeStart > 6000) {
            session.plan = 'pk_hunting';
            session.fleeStart = undefined;
        }
    }
};
