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
};

export default config;
