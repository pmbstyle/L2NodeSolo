require('../src/Global');
const Database = require('../src/Database');

Database.init(() => {
    Database.execute([
        "SELECT name, pvp, pk, karma FROM characters WHERE username LIKE 'bot_%' OR name = 'Aragorn'"
    ]).then((rows) => {
        console.log("=== Bot Karma & PK Status in DB ===");
        console.table(rows);
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
});
