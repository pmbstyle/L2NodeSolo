const TownPathfinder = {
    isInsideTown(loc) {
        const dx = loc.locX - (-84318);
        const dy = loc.locY - 244579;
        return Math.sqrt(dx*dx + dy*dy) < 2200; // Talking Island Village radius
    },

    getClosestExit(targetLoc) {
        const exits = [
            { locX: -84081, locY: 243227, locZ: -3723 }, // North Exit (Newbie Guide)
            { locX: -85400, locY: 244579, locZ: -3730 }, // West Exit
            { locX: -83150, locY: 244579, locZ: -3730 }, // East Exit
            { locX: -84318, locY: 245800, locZ: -3730 }  // South Exit
        ];

        let closest = exits[0];
        let minDist = 9999999;

        exits.forEach((exit) => {
            const dx = targetLoc.locX - exit.locX;
            const dy = targetLoc.locY - exit.locY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                closest = exit;
            }
        });

        return closest;
    },

    route(actor, from, to) {
        const fromInTown = this.isInsideTown(from);
        const toInTown = this.isInsideTown(to);

        // Case 1: Running from inside town to outside town (going to hunt)
        if (fromInTown && !toInTown) {
            const exit = this.getClosestExit(to);
            const dx = from.locX - exit.locX;
            const dy = from.locY - exit.locY;
            if (Math.sqrt(dx*dx + dy*dy) < 400) {
                return to; // Already at the exit gate, run directly to target
            }
            return exit; // Head to the exit gate first
        }

        // Case 2: Running from outside town to inside town (returning to town)
        if (!fromInTown && toInTown) {
            const exit = this.getClosestExit(from);
            const dx = from.locX - exit.locX;
            const dy = from.locY - exit.locY;
            if (Math.sqrt(dx*dx + dy*dy) < 400) {
                return to; // Already at the exit gate, run directly to town destination
            }
            return exit; // Head to the exit gate first
        }

        // Case 3: Both inside town (running from shop to plaza, etc.)
        if (fromInTown && toInTown) {
            const dx = to.locX - from.locX;
            const dy = to.locY - from.locY;
            if (Math.sqrt(dx*dx + dy*dy) < 800) {
                return to; // Close enough, walk directly
            }
            // Otherwise, route via central plaza first to avoid clipping fences/corners
            const center = { locX: -84318, locY: 244579, locZ: -3730 };
            const dxCenter = from.locX - center.locX;
            const dyCenter = from.locY - center.locY;
            if (Math.sqrt(dxCenter*dxCenter + dyCenter*dyCenter) < 400) {
                return to;
            }
            return center;
        }

        // Case 4: Both outside town, run directly
        return to;
    }
};

module.exports = TownPathfinder;
