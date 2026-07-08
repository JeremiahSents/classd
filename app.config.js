const fs = require("node:fs");

const appJson = require("./app.json");

const googleServicesFile = "./google-services.json";

module.exports = () => {
  const config = appJson.expo;

  if (fs.existsSync(googleServicesFile)) {
    config.android = {
      ...config.android,
      googleServicesFile,
    };
  }

  return config;
};
