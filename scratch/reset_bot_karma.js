require('../src/Global');
const Database = require('../src/Database');

Database.init(() => {
    // 1. Reset all normal bots to 0 PK/Karma/PvP
    Database.execute([
        "UPDATE characters SET pvp = 0, pk = 0, karma = 0 WHERE username LIKE 'bot_%' AND name <> 'Aragorn'"
    ]).then(() => {
        console.log("Success: Reset normal bots' PK/Karma/PvP to 0.");
        
        // 2. Set Aragorn to his default PK state
        return Database.execute([
            "UPDATE characters SET pvp = 0, pk = 5, karma = 9999 WHERE name = 'Aragorn'"
        ]);
    }).then(() => {
        console.log("Success: Re-flagged Aragorn as the designated PK.");
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
});
