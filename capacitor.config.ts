import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.pulso.social",
  appName: "pulso",
  webDir: "public",
  server: {
    // O app é uma casca nativa que abre o site já publicado — assim
    // qualquer atualização do site aparece na hora, sem precisar gerar
    // um novo APK.
    url: "https://pulsonet.up.railway.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0b0a10",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
