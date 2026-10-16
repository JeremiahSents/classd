// Dynamic layer over app.json (which stays the source of truth).
//
// google-services.json is git-ignored, so EAS's build servers never receive
// it. On EAS it comes from the GOOGLE_SERVICES_JSON file variable instead
// (eas env:create --type file); locally the file in the repo root is used.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
