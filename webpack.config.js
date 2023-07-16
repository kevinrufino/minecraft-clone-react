const path = require('path');
module.exports = {
  entry: './src/Workers/entry.js',
  mode: 'development',
  output: {
    filename: 'publicChunkWorker.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
};