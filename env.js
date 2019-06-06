const config = require('./config.json');

process.env.accessKeyId = config.env.auth.accessKeyId;
process.env.secretAccessKey = config.env.auth.secretAccessKey;
process.env.region = config.env.auth.region;