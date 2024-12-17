const vscode = require("vscode");
const fpath = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { execSync } = require("child_process");

var _adbPath = "";
function getAdbPath() {
  return _adbPath;
}

const ADB = {
  init(context) {
    let tools = context.asAbsolutePath("tools");
    let adbPath = fpath.join(tools, "platform-tools", "adb.exe");
    _adbPath = adbPath;
  },
  async getDevices() {
    try {
      console.log(`${getAdbPath()} devices`);
      return execSync(`${getAdbPath()} devices`)
        .toString()
        .split("\n")
        .slice(1)
        .filter((line) => line.includes("device"))
        .map((line) => line.split("\t")[0]);
    } catch (error) {
      console.log("error: ", error);
      return [];
    }
  },
  async queryApkInfo(packageName) {
    try {
      return execSync(
        `${getAdbPath()} shell pm list packages -i ${packageName}`
      )
        .toString()
        .trim();
    } catch (error) {
      return "";
    }
  },
  async startService(packageName, activityName, serviceName, extArgs) {
    // replace DevHelperHttpService to MainActivity
    let startCmd = `${getAdbPath()} shell am start ${packageName}/${activityName}`;
    console.log("startCmd: ", startCmd);
    execSync(startCmd);
    let startServiceCmd = `${getAdbPath()} shell am startservice ${extArgs} ${packageName}/${serviceName}`;
    console.log("startServiceCmd: ", startServiceCmd);
    execSync(startServiceCmd);
  },
  async restartActivity(packageName, activityName) {
    let restartCmd = `${getAdbPath()} shell am force-stop ${packageName} && ${getAdbPath()} shell am start ${packageName}/${activityName}`;
    console.log("restartCmd: ", restartCmd);
    execSync(restartCmd);
  },
  async forward(localPort, devicePort) {
    let forwardCmd = `${getAdbPath()} forward tcp:${localPort} tcp:${devicePort}`;
    console.log("forwardCmd: ", forwardCmd);
    execSync(forwardCmd);
  },
  async BuildInstallRun(apkPath, packageName, className) {
    let cmd = `${getAdbPath()} install -r ${apkPath}`;
    return [
      cmd,
      `${getAdbPath()} shell am start ` +
        `-e startupType reinit` +
        ` -n ${packageName}/${className}`,
    ];
  },
};

exports.ADB = ADB;
