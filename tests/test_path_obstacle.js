require('../src/Global');
const GeodataEngine = invoke('GameServer/Geodata/GeodataEngine');
GeodataEngine.init();

console.log("Testing pathfinding around Talking Island South Wall...");
// Start outside south wall, offset from the gate (gate is at -84081)
const startX = -84500;
const startY = 242800;
const startZ = -3730;

// End inside town
const endX = -84318;
const endY = 244100;
const endZ = -3730;

const startTime = Date.now();
const path = GeodataEngine.findPath(startX, startY, startZ, endX, endY, endZ);
const elapsed = Date.now() - startTime;

console.log(`Pathfinding took ${elapsed}ms`);
if (path) {
    console.log("SUCCESS! Path found with", path.length, "waypoints:");
    path.forEach((pt, idx) => {
        console.log(`  Waypoint ${idx}: X: ${pt.locX}, Y: ${pt.locY}, Z: ${pt.locZ}`);
    });
} else {
    console.log("FAILED to find path");
}
