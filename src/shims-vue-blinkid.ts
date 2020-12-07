// 1. Make sure to import 'vue' before declaring augmented types
import Vue from 'vue'
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

// 2. Specify a file with the types you want to augment
//    Vue has the constructor type in types/vue.d.ts
declare module 'vue/types/vue' {
  // 3. Declare augmentation for Vue
  interface Vue {
    $blink: BlinkIDSDK.WasmSDK;
    $useBlink: (runner: ($blink: BlinkIDSDK.WasmSDK) => void) => void;
  }
}
