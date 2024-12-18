const vscode = require("vscode");
const fpath = require("path");
const fs = require("fs");
const md5 = require("md5");
const { execSync, spawn } = require("child_process");
const xmlParser = require("xml2js");
const axios = require("axios");
const { ADB } = require("./adb");
const Utils = {
    mconsole: null,
    logcatTerminal: null,
    context: null,
    async getWorkspaceFolder() {
        let data = vscode.workspace.workspaceFolders;
        if (!data) {
            return;
        }
        if (data.length == 1) {
            return data[0].uri.fsPath;
        }

        let cur_file = vscode.window.activeTextEditor.document.fileName;

        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (cur_file.indexOf(element.uri.fsPath) != -1) {
                return element.uri.fsPath;
            }
        }

        let name = [];
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            name.push(element.uri.fsPath);
        }
        return await vscode.window.showQuickPick(name);
    },
    async getAppJson() {
        let workspace = await Utils.getWorkspaceFolder();
        try {
            let app_json = fpath.join(workspace, "app.json");
            let datab = fs.readFileSync(app_json, "utf-8");
            let resp = JSON.parse(datab);
            // console.log(resp);
            if (resp.length == 0) {
                return null;
            }
            return resp;
        } catch (error) {
            console.log(error);
        }
        return null;
    },
    async genIconContent() {
        let workspace = await Utils.getWorkspaceFolder();
        try {
            let app_info = await Utils.getAppJson();
            let icon_text = app_info["icon_text"];
            let icon_path = app_info["icon"];
            let icon_raw = "";
            // 判断是不是绝对路径
            if (!fpath.isAbsolute(icon_path)) {
                icon_path = fpath.join(workspace, icon_path);
            }
            if (icon_path.endsWith(".svg")) {
                icon_raw = fs.readFileSync(icon_path, "utf-8");
                if (icon_text) {
                    icon_raw = icon_raw.replace("{{icon_text}}", icon_text);
                }
            }
            return icon_raw;
        } catch (error) {
            console.log(error);
        }

        return "";
    },
    async adbDevHelperHttpService(packageName, esCmd) {
        let activityName = "com.mz.fastapp.SplashScreenActivity";

        let cmdBase64 = Buffer.from(esCmd).toString("base64");

        await ADB.startService(packageName, activityName, `com.mz.fastapp.DevHelperHttpService`, `--es cmd "${cmdBase64}"`);
    },
    localhost: "http://127.0.0.1",
    async syncToRemotOneFile(packageName, fileName) {
        let ppoboxExe = fpath.join(Utils.context.asAbsolutePath("tools"), "ppobox.exe");
        let workspace = await Utils.getWorkspaceFolder();
        let md5Workspace = md5(workspace);
        let fastdevTempDir = fpath.join(process.env.TEMP, "fastdev-py4android-temp", md5Workspace);

        let packDir = fpath.join(fastdevTempDir, "app-debug-unpacked");

        let activityName = await Utils.getActivityName(packDir);

        let serverPort = 56380;
        let sftpPort = serverPort + 1;

        let serviceCmd = `/usr/bin/ppobox file-summary-web --sftp-port=${sftpPort} --port ${serverPort} --dir /root/python_app`;

        await Utils.adbDevHelperHttpService(packageName, serviceCmd);
        await ADB.forward(serverPort, serverPort);
        await ADB.forward(sftpPort, sftpPort);

        try {
            let uploadCmd = `${ppoboxExe} gosftp-push --port=${sftpPort} --local=${fpath.join(
                workspace,
                fileName
            )} --remote=/root/python_app/${fileName} --username=root --password=root`;
            await Utils.callInInteractiveTerminal("push file", uploadCmd, false);
        } catch (error) {
            console.log("uploadResp error:", error);
        }

        try {
            let exitUrl = `${Utils.localhost}:${serverPort}/exit`;
            await axios.get(exitUrl);
        } catch (error) {}

        ADB.restartActivity(packageName, activityName);
    },
    async syncToRemotDiffFiles(packageName) {
        let ppoboxExe = fpath.join(Utils.context.asAbsolutePath("tools"), "ppobox.exe");

        let workspace = await Utils.getWorkspaceFolder();
        let md5Workspace = md5(workspace);
        let fastdevTempDir = fpath.join(process.env.TEMP, "fastdev-py4android-temp", md5Workspace);
        let toolsDir = await Utils.getToolsDir();
        let tmpFileSummaryJson = fpath.join(process.env.TEMP, "md5-workspace-summary.json");

        // ppobox file-summary -dir . -output a.json
        let cmdArgs = ["file-summary", "-dir", workspace, "-output", tmpFileSummaryJson];

        await new Promise((resolve, reject) => {
            let child = spawn(ppoboxExe, cmdArgs, {
                shell: true,
                cwd: workspace,
            });

            child.stderr.on("data", (data) => {
                console.log(data.toString());
            });

            child.on("error", (error) => {
                console.log(error);
                reject(error);
            });

            child.on("close", (code) => {
                console.log(`child process exited with code ${code}`);
                resolve();
            });
        });

        let fileSummary = fs.readFileSync(tmpFileSummaryJson, "utf-8");
        console.log("fileSummary:", fileSummary);

        let packDir = fpath.join(fastdevTempDir, "app-debug-unpacked");

        let activityName = await Utils.getActivityName(packDir);

        let serverPort = 56380;
        let sftpPort = serverPort + 1;

        let serviceCmd = `/usr/bin/ppobox file-summary-web --sftp-port ${sftpPort} --port ${serverPort} --dir /root/python_app`;

        await Utils.adbDevHelperHttpService(packageName, serviceCmd);

        await ADB.forward(serverPort, serverPort);
        await ADB.forward(sftpPort, sftpPort);
        // await ADB.forward(sftpPort + 1, sftpPort + 1);
        try {
            // /file-summary-diff POST json fileSummary
            let url = `${Utils.localhost}:${serverPort}/file-summary-diff`;
            let resp = await axios.post(url, fileSummary, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            let syncFiles = resp.data;
            console.log("file-summary-diff: ", syncFiles);

            // /file-upload POST file
            // let uploadUrl = `${Utils.localhost}:${serverPort}/file-upload`;
            let pushCmds = [];
            for (let index = 0; index < syncFiles.length; index++) {
                try {
                    // file not exists
                    Utils.mconsole.appendLine(`syncFiles: ${syncFiles[index]}`);
                    if (!fs.existsSync(fpath.join(workspace, syncFiles[index]))) {
                        Utils.mconsole.appendLine(`not exists: ${syncFiles[index]}`);
                        continue;
                    }
                    // skip dir
                    if (fs.lstatSync(fpath.join(workspace, syncFiles[index])).isDirectory()) {
                        Utils.mconsole.appendLine(`is dir: ${syncFiles[index]}`);
                        continue;
                    }

                    const element = syncFiles[index];
                    let src = fpath.join(workspace, element);
                    console.log(`uploadResp src : ${src}`);

                    // let fileContentBuffer = fs.readFileSync(src);
                    // let fileContent = fileContentBuffer.toString("base64");
                    // let reqData = {
                    //   filename: element,
                    //   file: fileContent,
                    // };

                    // let uploadResp = await axios.post(uploadUrl, reqData, {
                    //   headers: {
                    //     "Content-Type": "application/json",
                    //   },
                    // });
                    // console.log("uploadResp:", uploadResp);

                    pushCmds.push(
                        `${ppoboxExe} gosftp-push --port=${sftpPort} --local=${src} --remote=/root/python_app/${element} --username=root --password=root`
                    );

                    Utils.mconsole.appendLine(`complete: ${element}`);
                } catch (error) {
                    Utils.mconsole.appendLine(`error: ${error}`);
                    if (error.response) {
                        Utils.mconsole.appendLine(`error response: ${error.response.data}`);
                    }
                }
            }

            await Utils.callInInteractiveTerminalList("push files", pushCmds, false);

            try {
                // let showLogUrl = `${Utils.localhost}:${serverPort}/log`;
                // let logResp = await axios.get(showLogUrl);
                // console.log("ppobox log:", logResp.data);

                let exitUrl = `${Utils.localhost}:${serverPort}/exit`;
                await axios.get(exitUrl);
            } catch (error) {}
            ADB.restartActivity(packageName, activityName);
        } catch (error) {
            console.log(error);
        }
    },
    async getActivityName(packDir) {
        let activityName = "com.mz.fastapp.SplashScreenActivity";
        let androidManifest = fpath.join(packDir, "AndroidManifest.xml");
        if (!fs.existsSync(androidManifest)) {
            return activityName;
        }
        let androidManifestData = fs.readFileSync(androidManifest, "utf-8");
        let androidManifestXmlDoc = await xmlParser.parseStringPromise(androidManifestData);
        for (let index = 0; index < androidManifestXmlDoc.manifest.application[0].activity.length; index++) {
            // intent-filter android.intent.action.MAIN
            const element = androidManifestXmlDoc.manifest.application[0].activity[index];
            if (element["intent-filter"]) {
                for (let index = 0; index < element["intent-filter"].length; index++) {
                    const intent_filter = element["intent-filter"][index];
                    if (intent_filter.action[0].$["android:name"] == "android.intent.action.MAIN") {
                        activityName = element.$["android:name"];
                        break;
                    }
                }
            }
        }
        return activityName;
    },
    async wait(time) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    },
    getWebViewContent(context, templatePath) {
        const resourcePath = context.asAbsolutePath(templatePath);
        const dirPath = fpath.dirname(resourcePath);
        console.log(`resourcePath: ${resourcePath}`);
        let html = fs.readFileSync(resourcePath, "utf-8");
        // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
        html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
            return $1 + vscode.Uri.file(fpath.resolve(dirPath, $2)).with({ scheme: "vscode-resource" }).toString() + '"';
        });
        return html;
    },
    async config(context, scripts, bar, cb) {
        vscode.window.showQuickPick(scripts).then((data) => {
            if (data) {
                cb(data);
            }
        });
    },

    // fastdev-py4android.config.toolsDir
    async setConfig(key, value) {
        vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Global);
    },

    async getConfig(key) {
        return vscode.workspace.getConfiguration().get(key);
    },

    async getToolsDir() {
        let toolsDir = await Utils.getConfig("fastdev-py4android.config.tools_dir");
        // 获取home目录
        let home = process.env.HOME || process.env.USERPROFILE;
        toolsDir = toolsDir.replace("${userHome}", home);
        return toolsDir;
    },

    async getApksignerJar() {
        let toolsDir = await Utils.getToolsDir();
        return fpath.join(toolsDir, "apksigner.jar");
    },

    async getApktoolJar() {
        let toolsDir = await Utils.getToolsDir();
        return fpath.join(toolsDir, "apktool.jar");
    },

    async initUnpackApk() {
        let toolsDir = await Utils.getToolsDir();
        let unpacked = fpath.join(toolsDir, "app-debug-unpacked");
        let apktool = await Utils.getApktoolJar();
        // 删除unpacked
        if (fs.existsSync(unpacked)) {
            Utils.mconsole.appendLine(`${T("delete")} ${unpacked}`);
            fs.rmdirSync(unpacked, { recursive: true });
        }
        let apkPath = fpath.join(toolsDir, "app-debug.apk");
        let cmd = `java -jar -Xmx1024M -Duser.language=en -Dfile.encoding=UTF8 -Djdk.util.zip.disableZip64ExtraFieldValidation=true -Djdk.nio.zipfs.allowDotZipEntry=true "${apktool}" d "${apkPath}" -o "${unpacked}"`;
        await Utils.callInInteractiveTerminal("unpack apk", cmd);
    },

    async packApk(packDir, apkPath) {
        let toolsDir = await Utils.getToolsDir();
        let apktool = await Utils.getApktoolJar();
        let cmd = `java -jar -Xmx1024M -Duser.language=en -Dfile.encoding=UTF8 -Djdk.util.zip.disableZip64ExtraFieldValidation=true -Djdk.nio.zipfs.allowDotZipEntry=true "${apktool}" b "${packDir}" -o "${apkPath}"`;
        // await Utils.callInInteractiveTerminal("pack apk", cmd);
        return cmd;
    },
    async signApk(apkPath, outputPath) {
        let toolsDir = await Utils.getToolsDir();
        let apksigner = await Utils.getApksignerJar();
        let keystore = fpath.join(toolsDir, "dev.jks");
        let cmd = `java -jar "${apksigner}" sign --ks "${keystore}" --ks-pass pass:123456 --out "${outputPath}" "${apkPath}"`;
        // await Utils.callInInteractiveTerminal("sign apk", cmd);
        return cmd;
    },
    async downloadFile(url, dest) {
        // 直接使用PS 的 wget命令下载
        let toolsDir = await Utils.getToolsDir();
        let cmd = "";
        if (process.platform == "win32") {
            let got_path = fpath.join(toolsDir, "got.exe");
            cmd = `${got_path} -o ${dest} ${url}`;
        } else {
            vscode.window.showErrorMessage(T("not support platform"));
            return;
        }

        await Utils.callInInteractiveTerminal("download_url", cmd);
    },

    async cpSync(source, destination) {
        // 判断node版本不是16.7.0以上的版本
        // 则进入兼容处理
        // 这样处理是因为16.7.0的版本支持了直接复制文件夹的操作
        let [major, minor] = process.versions.node.split(".");
        if (Number(major) < 16 || (Number(major) == 16 && Number(minor) < 7)) {
            // 如果存在文件夹 先递归删除该文件夹
            // if (fs.existsSync(destination)) fs.rmSync(destination, { recursive: true })
            // 新建文件夹 递归新建
            fs.mkdirSync(destination, { recursive: true });
            // 读取源文件夹
            let rd = fs.readdirSync(source);
            rd.forEach((item) => {
                // 循环拼接源文件夹/文件全名称
                let sourceFullName = source + "/" + item;
                // 循环拼接目标文件夹/文件全名称
                let destFullName = destination + "/" + item;
                // 读取文件信息
                let lstatRes = fs.lstatSync(sourceFullName);
                // 是否是文件
                if (lstatRes.isFile()) fs.copyFileSync(sourceFullName, destFullName);
                // 是否是文件夹
                if (lstatRes.isDirectory()) cpSync(sourceFullName, destFullName);
            });
        } else {
            // fs.cpSync(source, destination, { recursive: true });
            return new Promise((resolve, reject) => {
                fs.cp(source, destination, { recursive: true }, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
    },
    async exec(cmd, cwd) {
        return new Promise((resolve, reject) => {
            let child = spawn(cmd, {
                shell: true,
                cwd: cwd,
            });

            child.stdout.on("data", (data) => {
                Utils.mconsole.appendLine(data.toString());
            });

            child.stderr.on("data", (data) => {
                Utils.mconsole.appendLine(data.toString());
            });
            child.on("error", (error) => {
                Utils.mconsole.appendLine(`${T("error")}: ${error}`);
                reject(error);
            });
            child.on("close", (code) => {
                // Utils.mconsole.appendLine(`${T("child process exited with code")} ${code}`);
                resolve(code);
            });
        });
    },
    async execCommandList(name, commandList) {
        Utils.mconsole.show();
        for (let index = 0; index < commandList.length; index++) {
            const element = commandList[index];
            Utils.mconsole.appendLine(`> ${element}`);
            let result = await Utils.exec(element);
            if (result != 0) {
                throw new Error(`exec error: ${element}`);
            }
        }
    },
    async callInInteractiveTerminalList(name, commandList, isPause = true) {
        const terminal = vscode.window.createTerminal({
            name,
            shellPath: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
        });
        terminal.show();
        commandList.forEach((command) => {
            terminal.sendText(command + " || pause && exit");
        });
        if (isPause) {
            terminal.sendText("pause && exit");
        }
        terminal.sendText("exit");
        return new Promise((resolve, reject) => {
            const disposeToken = vscode.window.onDidCloseTerminal(async (closedTerminal) => {
                if (closedTerminal === terminal) {
                    disposeToken.dispose();
                    if (terminal.exitStatus !== undefined) {
                        resolve(terminal.exitStatus);
                    } else {
                        reject(T("Terminal exited with undefined status"));
                    }
                }
            });
        });
    },
    logcatShow(packageName) {
        try {
            execSync(`${ADB.getAdbPath()} logcat -c`);
        } catch (error) {}
        if (!Utils.logcatTerminal) {
            Utils.logcatTerminal = vscode.window.createTerminal({
                name: "logcat",
                shellPath: process.platform === "win32" ? "PowerShell" : "/bin/bash",
            });
            Utils.logcatTerminal.show();
            try {
                Utils.logcatTerminal.sendText(`${ADB.getAdbPath()} logcat -s ${packageName} python.stdout -s ${packageName} python.stderr`);
            } catch (error) {
                Utils.mconsole.appendLine(error);
                vscode.window.showErrorMessage(error);
            }
            Utils.logcatTerminal.sendText("exit");
            vscode.window.onDidCloseTerminal((e) => {
                if (e === Utils.logcatTerminal) {
                    Utils.logcatTerminal = null;
                }
            });
        } else {
            Utils.logcatTerminal.show();
        }
    },
    async callInInteractiveTerminal(name, command, isPause = true) {
        const terminal = vscode.window.createTerminal({
            name,
            shellPath: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
        });
        terminal.show();
        terminal.sendText(command + " || pause && exit");
        // terminal.sendText("pause");
        if (isPause) {
            terminal.sendText("pause && exit");
        }
        terminal.sendText("exit");
        return new Promise((resolve, reject) => {
            const disposeToken = vscode.window.onDidCloseTerminal(async (closedTerminal) => {
                if (closedTerminal === terminal) {
                    disposeToken.dispose();
                    if (terminal.exitStatus !== undefined) {
                        resolve(terminal.exitStatus);
                    } else {
                        reject(T("Terminal exited with undefined status"));
                    }
                }
            });
        });
    },
};

exports.Utils = Utils;
