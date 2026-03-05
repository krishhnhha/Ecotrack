import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE foo (id INTEGER PRIMARY KEY, name TEXT)');
const insert = db.prepare('INSERT INTO foo (name) VALUES (?)');
insert.run('bar');

const select = db.prepare('SELECT * FROM foo');
const rows = select.all();
console.log(rows);
