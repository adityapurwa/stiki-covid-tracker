import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

export default {
  install(Vue: any, opt: unknown) {
    if (BlinkIDSDK.isBrowserSupported()) {
      const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(
        "sRwAAAYJbG9jYWxob3N0r/lOPg4/w35CpJlWKKUWxSUTEZbt+oCsX13gTDXSPhPsALm9xKHUcb2Xh8dKgygLine5eHK4yCsMK7jaaSEK2XdHnBkhHNoS2V2nIThviFrA0KXFLd8zVYI6UdGg1M8Opd2WLydF8Op8uon4xxur3ZtTXuaJK4kR1DSnJJqXQNvECTanfphKGpC/le2hGitFMulUjRFteTsyMfs4IbpgE4NoGlgeUOs6gGIicb7Y+XGBwL+n5q5+RabSSs7cK/Y7gCnUXHa6F0xHOV6YvV8z3Myhfuap9Q6l+Mqi5cEf+ysh73Y8/dvqKDbCig=="
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
