// Externs for Shadow-CLJS compilation
var global = {};
var process = { env: {} };
var console = { log: function() {}, error: function() {} };

// Chokidar
var chokidar = {
  watch: function(paths, options) {}
};

// Discord.js
var Discord = {
  Client: function(options) {},
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 1,
    MessageContent: 1
  }
};

var DiscordClient = {
  on: function(event, callback) {},
  login: function(token) {},
  channels: {
    fetch: function(id) {}
  },
  user: {
    setActivity: function(status) {},
    setUsername: function(username) {},
    setAvatar: function(url) {},
    setDisplayName: function(name) {}
  }
};

var DiscordMessage = {
  id: "",
  content: "",
  channelId: "",
  author: {
    id: "",
    bot: false
  }
};

var DiscordChannel = {
  send: function(content) {}
};

// Node FS Promises
var fsp = {
  readFile: function(path, encoding) {},
  writeFile: function(path, content, encoding) {}
};

// OpenAI
var OpenAI = {
  chat: {
    completions: {
      create: function(params) {}
    }
  },
  embeddings: {
    create: function(params) {}
  }
};
