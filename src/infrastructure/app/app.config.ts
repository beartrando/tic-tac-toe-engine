export const appConfig = {
    appName: process.env.APP_NAME ?? 'engine',
    appVersion: process.env.APP_VERSION ?? 'undefined',
    appEnv: process.env.APP_ENV ?? 'production',
};

export default appConfig;
