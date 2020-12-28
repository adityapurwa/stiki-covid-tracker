<template>
  <div id="app">
    <header class="header">
      <h1 class="title">COVID-19 Tracker</h1>
      <h2 class="prompt">
        Please Scan Your ID Card
      </h2>
    </header>
    <main class="main">
      <video class="video" ref="video"></video>
      <div class="overlay" v-if="loading">
        <div class="loader">
          <img src="./assets/loading.svg" alt="Loading" />
          Processing
        </div>
      </div>
      <div class="overlay" v-if="covidStatus !== 'Neutral'">
        <div
          class="result positive"
          v-if="covidStatus === 'Negative'"
          key="positive"
        >
          <div class="result-left">
            <CheckCircleIcon size="128" />
          </div>
          <div class="result-right">
            <h3 class="result-title">Pass!</h3>
            <h4 class="result-subtitle">
              Please proceed to enter
            </h4>
          </div>
        </div>
        <div
          class="result negative"
          v-if="covidStatus === 'Positive'"
          key="negative"
        >
          <div class="result-left">
            <AlertCircleIcon size="128" />
          </div>
          <div class="result-right">
            <h3 class="result-title">Stop!</h3>
            <h4 class="result-subtitle">
              You are not allowed to enter
            </h4>
          </div>
        </div>
      </div>
    </main>
    <footer class="footer">
      <div class="copyright">
        Copyright &copy; 2020 - COVID-19 Tracker
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from "vue-property-decorator";
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import {
  BlinkIdRecognizer,
  RecognizerResultState,
  RecognizerRunner,
  VideoRecognizer
} from "@microblink/blinkid-in-browser-sdk";
import { BlinkIdRecognizerResult } from "@microblink/blinkid-in-browser-sdk/types/Recognizers/BlinkID/Generic/BlinkIdRecognizer";

import { CheckCircleIcon, AlertCircleIcon } from "vue-feather-icons";
import http from "@/api/http";

enum CovidStatus {
  Neutral = "Neutral",
  Positive = "Positive",
  Negative = "Negative"
}

@Component({
  components: {
    CheckCircleIcon,
    AlertCircleIcon
  }
})
export default class App extends Vue {
  @Ref("video")
  private readonly videoRef!: HTMLVideoElement;
  private recognizer: BlinkIdRecognizer | null = null;
  private recognizerRunner: RecognizerRunner | null = null;
  private videoRecognizer: VideoRecognizer | null = null;
  private loading = false;
  private covidStatus: CovidStatus = CovidStatus.Neutral;

  mounted() {
    this.setupScanner();
  }

  async setupScanner() {
    this.$useBlink(async $blink => {
      try {
        this.recognizer = await BlinkIDSDK.createBlinkIdRecognizer($blink);
        this.recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
          $blink,
          [this.recognizer],
          true
        );
        this.videoRecognizer = await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
          this.videoRef,
          this.recognizerRunner
        );
        this.videoRecognizer.startRecognition(async recognitionState => {
          this.videoRecognizer?.pauseRecognition();
          if (recognitionState !== RecognizerResultState.Empty) {
            const result = await this.recognizer?.getResult();
            if (result) {
              this.loading = true;
              this.covidStatus = await this.getCovidStatus(result);
              this.loading = false;
              setTimeout(() => {
                this.covidStatus = CovidStatus.Neutral;
                this.videoRecognizer?.resumeRecognition(true);
              }, 5000);
            }
          }
        });
      } catch (error) {
        console.log(error);
        if (error.name === "VideoRecognizerError") {
          // Reason is of type BlinkIDSDK.NotSupportedReason and contains information why video
          // recognizer could not be used. Usually this happens when user didn't give permission
          // to use the camera or when a hardware or OS error occurs.
          const reason = (error as BlinkIDSDK.VideoRecognizerError).reason;
        }
      }
    });
  }

  private async getCovidStatus(
    result: BlinkIdRecognizerResult
  ): Promise<CovidStatus> {
    const extra = result.additionalAddressInformation.split("\n");
    const res = await http.post("scan", {
      nik: result.documentNumber,
      name: result.fullName,
      birthday: new Date(
        result.dateOfBirth.year,
        result.dateOfBirth.month,
        result.dateOfBirth.day
      ),
      birthplace: result.placeOfBirth,
      address1: result.address,
      address2: result.additionalAddressInformation,
      city: extra[1],
      province: extra[0]
    });
    const data = res.data;
    const firstLog = data.logs[0];
    if (!firstLog) {
      return CovidStatus.Negative;
    }
    const firstLogDate = new Date(firstLog.testDate);
    const now = new Date();
    const diff = now.getTime() - firstLogDate.getTime();
    if (diff / 1000 / 60 / 60 / 24 <= 7 && firstLog.status === "positive") {
      return CovidStatus.Positive;
    }
    return CovidStatus.Negative;
  }

  destroy() {
    this.videoRecognizer?.releaseVideoFeed();
    this.recognizerRunner?.delete();
    this.recognizer?.delete();
  }
}
</script>

<style lang="scss">
@import "./css/reset.css";
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.header,
.main,
.footer {
  padding: 32px;
  text-align: center;
}
.title {
  font-size: 42px;
  color: #e67e22;
  margin-bottom: 16px;
  font-weight: bolder;
}
.prompt {
  font-size: 32px;
  color: #000;
  text-transform: uppercase;
}
.header {
  flex: 0 0 auto;
}
.main {
  flex: 1 1 auto;
  height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  .video {
    height: 100%;
    margin: auto;
    border-radius: 8px;
  }
}
.footer {
  flex: 0 0 auto;
  .copyright {
    opacity: 0.5;
  }
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: #fffc;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
.loader {
  font-size: 32px;
  padding: 24px;
  background: #333;
  color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  animation: fadeIn 0.3s ease;
  img {
    margin-right: 16px;
    height: 32px;
  }
}
.result {
  display: flex;
  align-items: center;
  color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05), 0 24px 64px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.3s ease;

  &.positive {
    background: #6ebc7f;
    padding: 128px;
  }
  &.negative {
    background: #ea7161;
    padding: 128px;
  }
  .result-left {
    flex: 0 0 auto;
    margin-right: 32px;
  }
  .result-right {
    flex: 1 1 auto;
  }
  .result-title,
  .result-subtitle {
    text-align: left;
  }
  .result-title {
    font-size: 64px;
    margin-bottom: 16px;
  }
  .result-subtitle {
    font-size: 36px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
