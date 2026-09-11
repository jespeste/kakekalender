// Vercel deployments get a BLOB_READ_WRITE_TOKEN once a Blob store is connected
// to the project; everywhere else (Docker, local dev) falls back to a JSON
// file on disk. Same interface either way: listEntries/addEntry/updateEntry/deleteEntry.
const usingBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!usingBlob && process.env.VERCEL) {
  // Vercel's function filesystem is read-only outside /tmp, so the file
  // store's fs.mkdirSync/writeFileSync calls will throw here. Logged clearly
  // so it shows up as the real cause in Runtime Logs instead of a bare EROFS.
  console.error(
    'FEIL: Kjører på Vercel uten BLOB_READ_WRITE_TOKEN. Koble en Blob-store til prosjektet (Storage-fanen) og deploy på nytt - filbasert lagring fungerer ikke på Vercel.'
  );
}

module.exports = usingBlob ? require('./store-blob') : require('./store-file');
