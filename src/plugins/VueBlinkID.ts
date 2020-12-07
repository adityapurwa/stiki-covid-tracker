import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

export default {
  install(Vue: any, opt: unknown) {
    if (BlinkIDSDK.isBrowserSupported()) {
      const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(
        process.env.VUE_APP_BLINKID_KEY
      );
      const deferredUsers: (($blink: BlinkIDSDK.WasmSDK) => void)[] = [];
      Vue.prototype.$useBlink = (
        user: ($blink: BlinkIDSDK.WasmSDK) => void
      ) => {
        if (!Vue.prototype.$blink) {
          deferredUsers.push(user);
        } else {
          user(Vue.prototype.$blink);
        }
      };
      BlinkIDSDK.loadWasmModule(loadSettings).then(
        (wasmSDK: BlinkIDSDK.WasmSDK) => {
          Vue.prototype.$blink = wasmSDK;
          for (const user of deferredUsers) {
            user(Vue.prototype.$blink);
          }
        },
        (error: any) => {
          // Error happened during the initialization of the SDK
          console.error("Error during the initialization of the SDK!", error);
        }
      );
    } else {
      console.warn("This browser is not supported by the SDK!");
    }
  }
};
