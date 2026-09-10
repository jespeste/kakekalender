// Vercel deployments get a BLOB_READ_WRITE_TOKEN once a Blob store is connected
// to the project; everywhere else (Docker, local dev) falls back to a JSON
// file on disk. Same interface either way: listEntries/addEntry/updateEntry/deleteEntry.
module.exports = process.env.BLOB_READ_WRITE_TOKEN ? require('./store-blob') : require('./store-file');
