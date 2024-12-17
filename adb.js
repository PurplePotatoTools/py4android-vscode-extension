const vscode = require("vscode");
const fpath = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { execSync } = require("child_process");
const ADB = {
  async getDevices() {
    try {
      return execSync("adb devices")
        .toString()
        .split("\n")
        .slice(1)
        .filter((line) => line.includes("device"))
        .map((line) => line.split("\t")[0]);
    } catch (error) {
      return [];
    }
  },
  async queryApkInfo(packageName) {
    try {
      return execSync(`adb shell pm list packages -i ${packageName}`)
        .toString()
        .trim();
    } catch (error) {
      return "";
    }
  },
  async startService(packageName, activityName, serviceName, extArgs) {
    // replace DevHelperHttpService to MainActivity
    let startCmd = `adb shell am start ${packageName}/${activityName}`;
    console.log("startCmd: ", startCmd);
    execSync(startCmd); 
    let startServiceCmd = `adb shell am startservice ${extArgs} ${packageName}/${serviceName}`;
    console.log("startServiceCmd: ", startServiceCmd);
    execSync(
      startServiceCmd
    ) 
  },
  async restartActivity(packageName, activityName) {
    let restartCmd = `adb shell am force-stop ${packageName} && adb shell am start ${packageName}/${activityName}`;
    console.log("restartCmd: ", restartCmd);
    execSync(restartCmd);
  },
  async forward(localPort, devicePort) {
    let forwardCmd = `adb forward tcp:${localPort} tcp:${devicePort}`;
    console.log("forwardCmd: ", forwardCmd);
    execSync(forwardCmd);
  },
};

exports.ADB = ADB;
