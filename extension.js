const vscode = require("vscode");
const resvg = require("@resvg/resvg-js").Resvg;
const sharp = require("sharp");
const T = vscode.l10n.t;
const admZip = require("adm-zip");
const fs = require("fs");
const fpath = require("path");
const md5 = require("md5");
const xml2js = require("xml2js");
const xmlBuilder = new xml2js.Builder();
const xmlParser = new xml2js.Parser();
const { execSync } = require("child_process");
const { spawn } = require("child_process");
const { Utils } = require("./utils");
const { ADB } = require("./adb");

let mconsole = vscode.window.createOutputChannel("fastdev-py4android");
Utils.mconsole = mconsole;
let logcatTerminal = null;

let commandArgs = {};

let globalLocker = false;

let registerCommandFuns = {
  "extension.FastdevPy4a.OneFilePatchFastRun": async function (context) {
    mconsole.show();
    mconsole.appendLine(`${T("fast_run_mode")}`);
    let workspace = await Utils.getWorkspaceFolder();
    let toolsDir = await Utils.getToolsDir();
    mconsole.appendLine(`${T("workspace")}: ${workspace}`);
    mconsole.appendLine(`${T("toolsDir")}: ${toolsDir}`);

    // 获取app.json
    let appJson = fpath.join(workspace, "app.json");
    let configData = fs.readFileSync(appJson, "utf-8");
    try {
      configData = JSON.parse(configData);
    } catch (error) {
      vscode.window.showErrorMessage("app.json parse error");
      return;
    }

    // 获取app_name
    let appName = configData.app_name;
    mconsole.appendLine(`${T("appName")}: ${appName}`);

    // 获取package
    let packageName = configData.package;
    mconsole.appendLine(`${T("packageName")}: ${packageName}`);

    // 对当前路径做md5
    let md5_workspace = md5(workspace);

    // 获取系统临时目录
    let fastdevTempDir = fpath.join(
      process.env.TEMP,
      "fastdev-py4android-temp",
      md5_workspace
    );
    let packDir = fpath.join(fastdevTempDir, "app-debug-unpacked");

    let activityName = await Utils.getActivityName(packDir);

    let currentFile = vscode.window.activeTextEditor.document.fileName;
    let rootDirPath = workspace;

    let relativePath = fpath.relative(rootDirPath, currentFile);
    Utils.context = context;
    Utils.syncToRemotOneFile(packageName, relativePath);
  },
  "extension.FastdevPy4a.PatchFastRun": async function (context) {
    mconsole.show();
    mconsole.appendLine(`${T("fast_run_mode")}`);
    let workspace = await Utils.getWorkspaceFolder();
    let toolsDir = await Utils.getToolsDir();
    mconsole.appendLine(`${T("workspace")}: ${workspace}`);
    mconsole.appendLine(`${T("toolsDir")}: ${toolsDir}`);

    // 获取app.json
    let appJson = fpath.join(workspace, "app.json");
    let configData = fs.readFileSync(appJson, "utf-8");
    try {
      configData = JSON.parse(configData);
    } catch (error) {
      vscode.window.showErrorMessage("app.json parse error");
      return;
    }

    // 获取app_name
    let appName = configData.app_name;
    mconsole.appendLine(`${T("appName")}: ${appName}`);

    // 获取package
    let packageName = configData.package;
    mconsole.appendLine(`${T("packageName")}: ${packageName}`);

    // 对当前路径做md5
    let md5_workspace = md5(workspace);

    // 获取系统临时目录
    let fastdevTempDir = fpath.join(
      process.env.TEMP,
      "fastdev-py4android-temp",
      md5_workspace
    );
    let packDir = fpath.join(fastdevTempDir, "app-debug-unpacked");

    let activityName = await Utils.getActivityName(packDir);

    // 将assetsDir中所有文件使用adb上传到 /sdcard/Android/data/包名/files/patch/python_app/
    Utils.context = context;
    Utils.syncToRemotDiffFiles(packageName);
  },
  "extension.FastdevPy4a.BuildInstallRun": async function (context) {
    mconsole.show();
    let workspace = await Utils.getWorkspaceFolder();
    let toolsDir = await Utils.getToolsDir();
    mconsole.appendLine(`${T("workspace")}: ${workspace}`);
    mconsole.appendLine(`${T("toolsDir")}: ${toolsDir}`);

    // 获取app.json
    let appJson = fpath.join(workspace, "app.json");
    let configData = fs.readFileSync(appJson, "utf-8");
    try {
      configData = JSON.parse(configData);
    } catch (error) {
      vscode.window.showErrorMessage("app.json parse error");
      return;
    }

    let rootfsDir = fpath.join(context.asAbsolutePath("tools"), "rootfs");
    let rootfsName = configData.rootfs;
    let rootfs = rootfsName;
    // 判断rootfsName是否是绝对路径
    if (!fpath.isAbsolute(rootfsName)) {
      rootfs = fpath.join(rootfsDir, rootfsName);
    } else {
      rootfs = rootfsName;
    }

    // 获取app_name
    let appName = configData.app_name;
    mconsole.appendLine(`${T("appName")}: ${appName}`);

    // 获取package
    let packageName = configData.package;
    mconsole.appendLine(`${T("packageName")}: ${packageName}`);

    // 对当前路径做md5
    let md5_workspace = md5(workspace);

    // 获取系统临时目录
    let fastdevTempDir = fpath.join(
      process.env.TEMP,
      "fastdev-py4android-temp",
      md5_workspace
    );

    // mconsole.appendLine(`clean temp dir: ${fastdevTempDir}`);
    // // 删除fastdevTempDir
    // if (fs.existsSync(fastdevTempDir)) {
    //   fs.rmdirSync(fastdevTempDir, { recursive: true });
    // }
    // mconsole.appendLine(`create temp dir: ${fastdevTempDir}`);
    let packDir = fpath.join(fastdevTempDir, "app-debug-unpacked");
    if (!fs.existsSync(fastdevTempDir)) {
      fs.mkdirSync(fastdevTempDir, { recursive: true });
      // 复制tools中的app-debug-unpacked到.fastdev-py4android目录
      let unpacked = fpath.join(toolsDir, "app-debug-unpacked");
      mconsole.appendLine(`copy ${unpacked} => ${packDir}`);
      await Utils.cpSync(unpacked, packDir);
      mconsole.appendLine(`${T("copy done")}`);
    }

    // 复制rootfs到assets/system/rootfs.tar
    let rootfsTarPath = fpath.join(packDir, "assets/system/rootfs.tar");
    mconsole.appendLine(`copy ${rootfs} => ${rootfsTarPath}`);
    await Utils.cpSync(rootfs, rootfsTarPath);

    // AndroidManifest.xml
    let androidManifest = fpath.join(packDir, "AndroidManifest.xml");
    let androidManifestData = fs.readFileSync(androidManifest, "utf-8");
    let androidManifestXmlDoc = await xmlParser.parseStringPromise(
      androidManifestData
    );
    // update:  manifest -> package = ${package}
    console.log(
      "androidManifestXmlDoc.manifest: ",
      androidManifestXmlDoc.manifest
    );
    androidManifestXmlDoc.manifest.$["package"] = packageName;
    // update:  manifest -> application -> provider -> android:authorities  =  ${package}.androidx-startup

    let providers = androidManifestXmlDoc.manifest.application[0].provider;

    // androidManifestXmlDoc.manifest.application[0].provider[0].$[
    //   "android:authorities"
    // ] = `${packageName}.androidx-startup`;
    for (let index = 0; index < providers.length; index++) {
      const element = providers[index];
      let original_authorities = element.$["android:authorities"];
      // com.mz.fastapp -> ${package}
      let authorities = original_authorities.replace(
        "com.mz.fastapp",
        packageName
      );

      element.$["android:authorities"] = authorities;
    }

    let activityName = ".MainActivity";
    for (
      let index = 0;
      index < androidManifestXmlDoc.manifest.application[0].activity.length;
      index++
    ) {
      // intent-filter android.intent.action.MAIN
      const element =
        androidManifestXmlDoc.manifest.application[0].activity[index];
      if (element["intent-filter"]) {
        for (let index = 0; index < element["intent-filter"].length; index++) {
          const intent_filter = element["intent-filter"][index];
          if (
            intent_filter.action[0].$["android:name"] ==
            "android.intent.action.MAIN"
          ) {
            activityName = element.$["android:name"];
            break;
          }
        }
      }
    }

    // update:  manifest -> permission[?] -> android:name = ${package}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
    for (
      let index = 0;
      index < androidManifestXmlDoc.manifest.permission.length;
      index++
    ) {
      const element = androidManifestXmlDoc.manifest.permission[index];
      if (
        element.$["android:name"].indexOf(
          ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
        ) != -1
      ) {
        androidManifestXmlDoc.manifest.permission[index].$[
          "android:name"
        ] = `${packageName}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`;
        break;
      }
    }

    // update:  manifest -> uses-permission[?] -> android:name = ${package}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
    for (
      let index = 0;
      index < androidManifestXmlDoc.manifest["uses-permission"].length;
      index++
    ) {
      const element = androidManifestXmlDoc.manifest["uses-permission"][index];
      // DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION in uses-permission
      if (
        element.$["android:name"].indexOf(
          ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
        ) != -1
      ) {
        androidManifestXmlDoc.manifest["uses-permission"][index].$[
          "android:name"
        ] = `${packageName}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`;
        break;
      }
    }

    // console.log(
    //   "androidManifestXmlDoc: ",
    //   xmlBuilder.buildObject(androidManifestXmlDoc)
    // );
    // write AndroidManifest.xml
    fs.writeFileSync(
      androidManifest,
      xmlBuilder.buildObject(androidManifestXmlDoc)
    );

    // res\values\strings.xml
    let stringsXml = fpath.join(packDir, "res/values/strings.xml");
    let stringsXmlData = fs.readFileSync(stringsXml, "utf-8");
    let stringsXmlDoc = await xmlParser.parseStringPromise(stringsXmlData);

    for (
      let index = 0;
      index < stringsXmlDoc.resources.string.length;
      index++
    ) {
      const element = stringsXmlDoc.resources.string[index];
      if (element.$.name == "app_name") {
        stringsXmlDoc.resources.string[index]._ = appName;
        break;
      }
    }
    var newStringsXmlDoc = xmlBuilder.buildObject(stringsXmlDoc);
    // write strings.xml
    fs.writeFileSync(stringsXml, newStringsXmlDoc);

    let apktoolYml = fpath.join(packDir, "apktool.yml");
    // versionInfo -> versionName = ${version_name}
    let versionName = configData.version_name;
    let versionCode = configData.version_code;

    let apktoolYmlData = fs.readFileSync(apktoolYml, "utf-8");
    apktoolYmlData = apktoolYmlData.replace(
      /versionName: .*/,
      `versionName: ${versionName}`
    );
    apktoolYmlData = apktoolYmlData.replace(
      /versionCode: .*/,
      `versionCode: ${versionCode}`
    );
    fs.writeFileSync(apktoolYml, apktoolYmlData);

    // 资源拷贝到 assets\python_app\
    let assetsDir = fpath.join(packDir, "assets/python_app");

    // 删除 assetsDir 除了 "__fapp_startup__.py"
    if (fs.existsSync(assetsDir)) {
      mconsole.appendLine(`delete ${assetsDir}`);
      let assetsDirFiles = fs.readdirSync(assetsDir);
      for (let index = 0; index < assetsDirFiles.length; index++) {
        const element = assetsDirFiles[index];
        let src = fpath.join(assetsDir, element);
        if (fs.lstatSync(src).isDirectory()) {
          fs.rmdirSync(src, { recursive: true });
        } else {
          fs.unlinkSync(src);
        }
      }
    }

    fs.mkdirSync(assetsDir, { recursive: true });
    let workspaceDirs = fs.readdirSync(workspace);
    mconsole.appendLine(`copy to ${assetsDir}`);
    for (let index = 0; index < workspaceDirs.length; index++) {
      const element = workspaceDirs[index];
      let src = fpath.join(workspace, element);
      let dest = fpath.join(assetsDir, element);
      if (fs.lstatSync(src).isDirectory()) {
        await Utils.cpSync(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    // 获取app.json中的icon路径
    let iconPath = fpath.join(workspace, configData.icon);
    // if (iconPath.endsWith(".svg")) {
    // 判断类型是svg还是png
    //   // 统一先转成png
    //   let tempIconPath = fpath.join(fastdevTempDir, "temp_icon.png");
    //   let svgData = fs.readFileSync(iconPath, "utf-8");
    //   let pngData = new resvg(svgData, { width: 1024, height: 1024 });
    //   let pngBuffer = pngData.render().asPng();
    //   fs.writeFileSync(tempIconPath, pngBuffer);
    //   iconPath = tempIconPath;
    //   console.log(`iconPath: ${iconPath}`);
    // }
    if (iconPath.endsWith(".svg")) {
      let icon_text = configData?.icon_text;
      let tempIconPath = fpath.join(fastdevTempDir, "temp_icon.svg");
      let svgData = fs.readFileSync(iconPath, "utf-8");
      svgData = svgData.replace("{{icon_text}}", icon_text);
      fs.writeFileSync(tempIconPath, svgData);
      iconPath = tempIconPath;
    }

    const iconImage = sharp(iconPath);

    // res/mipmap-mdpi/ic_launcher.webp 48x48
    // res/mipmap-hdpi/ic_launcher.webp 72x72
    // res/mipmap-xhdpi/ic_launcher.webp 96x96
    // res/mipmap-xxhdpi/ic_launcher.webp 144x144
    // res/mipmap-xxxhdpi/ic_launcher.webp 192x192

    let iconWebpPath;
    // 转成webp格式 保存到 res/mipmap-xxxhdpi/ic_launcher.webp
    iconWebpPath = fpath.join(packDir, "res/mipmap-xxxhdpi/ic_launcher.webp");
    await iconImage.resize(192, 192).webp().toFile(iconWebpPath);
    // 转成webp格式 保存到 res/mipmap-xxhdpi/ic_launcher.webp
    iconWebpPath = fpath.join(packDir, "res/mipmap-xxhdpi/ic_launcher.webp");
    await iconImage.resize(144, 144).webp().toFile(iconWebpPath);
    // 转成webp格式 保存到 res/mipmap-xhdpi/ic_launcher.webp
    iconWebpPath = fpath.join(packDir, "res/mipmap-xhdpi/ic_launcher.webp");
    await iconImage.resize(96, 96).webp().toFile(iconWebpPath);
    // 转成webp格式 保存到 res/mipmap-hdpi/ic_launcher.webp
    iconWebpPath = fpath.join(packDir, "res/mipmap-hdpi/ic_launcher.webp");
    await iconImage.resize(72, 72).webp().toFile(iconWebpPath);
    // 转成webp格式 保存到 res/mipmap-mdpi/ic_launcher.webp
    iconWebpPath = fpath.join(packDir, "res/mipmap-mdpi/ic_launcher.webp");
    await iconImage.resize(48, 48).webp().toFile(iconWebpPath);

    // 删除 res/mipmap-anydpi-v26 文件夹, 矢量图标暂时不处理
    let anydpiV26 = fpath.join(packDir, "res/mipmap-anydpi-v26");
    if (fs.existsSync(anydpiV26)) {
      mconsole.appendLine(
        `delete ${anydpiV26}, vector illustration temporarily not processed`
      );
      fs.rmdirSync(anydpiV26, { recursive: true });
    }

    // 对app-debug-unpacked中重新打包
    let apkPath = fpath.join(fastdevTempDir, "debug-unsigned.apk");
    // 删除debug-unsigned.apk
    if (fs.existsSync(apkPath)) {
      mconsole.appendLine(`delete ${apkPath}`);
      fs.unlinkSync(apkPath);
    }
    let cmds = [];
    cmds.push(await Utils.packApk(packDir, apkPath));
    // 对debug-unsigned.apk进行签名
    let signedApkPath = fpath.join(fastdevTempDir, "debug-signed.apk");
    // 删除debug-signed.apk
    if (fs.existsSync(signedApkPath)) {
      mconsole.appendLine(`delete ${signedApkPath}`);
      fs.unlinkSync(signedApkPath);
    }
    cmds.push(await Utils.signApk(apkPath, signedApkPath));

    // 安装apk
    let cmds_ = await ADB.BuildInstallRun(
      signedApkPath,
      packageName,
      activityName
    );
    cmds.push(...cmds_);
    try {
      await Utils.execCommandList("fastdev-py4android", cmds);
      vscode.window.showInformationMessage(T("adb run done"));
    } catch (error) {
      vscode.window.showErrorMessage(error);
    }

    // packageName , python.stdout
    // await Utils.callInInteractiveTerminal(
    //   "logcat",
    //   `adb logcat -s ${packageName} python.stdout`
    // );
    Utils.logcatShow(packageName);
  },
  "extension.FastdevPy4a.Init": async function (context) {
    let toolsDir = await Utils.getToolsDir();

    // 删除已经存在的tools_dir
    if (fs.existsSync(toolsDir)) {
      mconsole.appendLine(`delete ${toolsDir}`);
      await Utils.wait(500);
      fs.rmdirSync(toolsDir, { recursive: true });
      mconsole.appendLine(T("delete done"));
    }

    // 创建tools_dir 目录
    fs.mkdirSync(toolsDir, { recursive: true });
    mconsole.appendLine(`${T("create toolsDir")}: ${toolsDir}`);

    // 复制tools中的文件到tools_dir
    let tools = context.asAbsolutePath("tools");
    let files = fs.readdirSync(tools);
    for (let index = 0; index < files.length; index++) {
      const element = files[index];
      if (element == "rootfs") {
        continue;
      }
      if (element == "ppobox.exe") {
        continue;
      }
      if (element == "platform-tools") {
        continue;
      }
      let src = fpath.join(tools, element);
      let dest = fpath.join(toolsDir, element);
      if (!fs.existsSync(dest)) {
        await Utils.cpSync(src, dest);
        console.log(`copy ${src} to ${dest}`);
        mconsole.appendLine(`=> ${dest}`);
      }
    }

    mconsole.appendLine(T("initial apk"));

    await Utils.initUnpackApk();

    vscode.window.showInformationMessage(T("init done"));

    registerCommandFuns["extension.FastdevPy4a.ClearTemp"](context);
  },
  "extension.FastdevPy4a.CreateProject": async function (context) {
    let template = context.asAbsolutePath("template");
    let workspace = await Utils.getWorkspaceFolder();

    let app_json = fpath.join(workspace, "app.json");
    let app_py = fpath.join(workspace, "app.py");
    if (fs.existsSync(app_json) || fs.existsSync(app_py)) {
      vscode.window.showErrorMessage(
        `app.json/app.py ${T("file already exists")}`
      );
      return;
    }

    await Utils.cpSync(template, workspace);

    vscode.window.showInformationMessage(T("create project done"));
  },
  "extension.FastdevPy4a.ClearTemp": async function (context) {
    let workspace = await Utils.getWorkspaceFolder();
    let md5_workspace = md5(workspace);
    let fastdevTempDir = fpath.join(
      process.env.TEMP,
      "fastdev-py4android-temp",
      md5_workspace
    );

    if (fs.existsSync(fastdevTempDir)) {
      mconsole.appendLine(`${T("delete")} ${fastdevTempDir}`);

      try {
        console.log(`delete ${fastdevTempDir}`);
        fs.rmdirSync(fastdevTempDir, { recursive: true, force: true });
        console.log(`delete done`);
      } catch (error) {
        console.log(error);
        mconsole.appendLine(error);
        vscode.window.showErrorMessage(T("clear temp error"));
        return;
      }
      vscode.window.showInformationMessage(T("clear temp done"));
    }
  },
  "extension.FastdevPy4a.DependencyInstallation": async function (context) {
    console.log("DependencyInstallation commandArgs: ", commandArgs);
    let workspace = await Utils.getWorkspaceFolder();
    let currentDependency = commandArgs?.dependency || "";

    if (currentDependency == "") {
      return;
    }

    let preinstalled = fpath.join(workspace, "whl_preinstalled");
    if (!fs.existsSync(preinstalled)) {
      fs.mkdirSync(preinstalled, { recursive: true });
    }

    let cmd = `pip download -d ${preinstalled} --only-binary=:all: --ignore-requires-python --platform none --platform manylinux2014_aarch64 --platform manylinux_aarch64 --python-version 3.11 --trusted-host mirrors.aliyun.com -i http://mirrors.aliyun.com/pypi/simple ${currentDependency}`;

    await Utils.callInInteractiveTerminal("dependency installation", cmd);

    commandArgs = {};
  },
};

let webviewMessageHandlers = {
  save_app_info: async function (context, webviewView, message) {
    console.log("save_app_info");
    let workspace = await Utils.getWorkspaceFolder();
    console.log(message.args);
    if (message.args) {
      let app_json = fpath.join(workspace, "app.json");
      fs.writeFileSync(app_json, JSON.stringify(message.args, null, 4));
    }
    await webviewMessageHandlers.all_info(context, webviewView, message);
    vscode.window.showInformationMessage(T("save done"));
  },
  get_app_info: async function (context, webviewView, message) {
    console.log("get_app_info");
    let workspace = await Utils.getWorkspaceFolder();
    let data = {};
    let app_json = fpath.join(workspace, "app.json");
    if (fs.existsSync(app_json)) {
      data = JSON.parse(fs.readFileSync(app_json, "utf-8"));
    }
    webviewView.webview.postMessage({
      command: "get_app_info",
      data: data,
    });
  },
  all_info: async function (context, webviewView, message) {
    let workspace = await Utils.getWorkspaceFolder();
    let data = {};

    data["app"] = await Utils.getAppJson();
    data["is_workfolder_init"] = data["app"] ? true : false;
    // console.log("app: ", data["app"]);

    // is init
    let toolsDir = await Utils.getToolsDir();
    data["is_init_tools"] = fs.existsSync(toolsDir);
    data["is_global_locker"] = globalLocker;
    data["workspace_path"] = `${workspace.replace(/\\/g, "/")}`;

    packageInfo = {};
    if (data["app"]) {
      data["icon_raw"] = await Utils.genIconContent();
      packageInfo = await ADB.queryApkInfo(data["app"].package);
    }

    let rootfsDir = fpath.join(context.asAbsolutePath("tools"), "rootfs");
    let rootfsList = [];
    if (fs.existsSync(rootfsDir)) {
      let rootfsFiles = fs.readdirSync(rootfsDir);
      for (let index = 0; index < rootfsFiles.length; index++) {
        const element = rootfsFiles[index];
        rootfsList.push(element);
      }
    }
    data["rootfs_list"] = rootfsList;

    adbDevices = await ADB.getDevices();
    // console.log("packageInfo: ", JSON.stringify(packageInfo, null, 4));
    data["adb_info"] = {
      devices: adbDevices,
      package_info: packageInfo,
    };

    webviewView.webview.postMessage({
      command: "all_info",
      data: data,
    });
  },
};

function createSidebarPanel(context, view) {
  var sidebarPanel = {
    resolveWebviewView: async function (webviewView, wvcontext, token) {
      try {
        console.log("resolveWebviewView");
        webviewView.webview.options = {
          enableScripts: true,
        };
        //views/view1.html
        webviewView.webview.html = Utils.getWebViewContent(context, view);
        webviewView.webview.onDidReceiveMessage(async (message) => {
          let workspace = await Utils.getWorkspaceFolder();
          if (webviewMessageHandlers[message.command]) {
            webviewMessageHandlers[message.command](
              context,
              webviewView,
              message
            );
          } else {
            if (message.args) {
              commandArgs = message.args;
            }
            vscode.commands.executeCommand(message.command);
          }
        });
      } catch (error) {
        console.log(error);
        throw new Error("Error loading webview");
      }
    },
  };
  return sidebarPanel;
}

function registerCoreCommand(context) {
  ADB.init(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "view1",
      createSidebarPanel(context, "views/view1.html")
    ),
    vscode.window.registerWebviewViewProvider(
      "view2",
      createSidebarPanel(context, "views/view2.html")
    )
  );

  for (const key in registerCommandFuns) {
    const element = registerCommandFuns[key];
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async () => {
        if (globalLocker) {
          vscode.window.showInformationMessage(T("executing, please wait"));
          return;
        }
        mconsole.show();
        console.log(`command start: ${key}`);
        globalLocker = true;
        try {
          await element(context);
        } catch (error) {
          globalLocker = false;
          mconsole.appendLine(error);
          vscode.window.showErrorMessage(error);
        }
        globalLocker = false;
        console.log(`command end: ${key}`);
      })
    );
  }

  var checkFastdevpy4aProject = async (e) => {
    await Utils.wait(1000);
    // 查询工作区目录下是否有app.json和app.py文件
    let workspace = await Utils.getWorkspaceFolder();
    let app_json = fpath.join(workspace, "app.json");
    let app_py = fpath.join(workspace, "app.py");
    if (fs.existsSync(app_json) && fs.existsSync(app_py)) {
      console.log("fastpy4a.enable true");
      vscode.commands.executeCommand("setContext", "fastpy4a.enable", true);
    } else {
      console.log("fastpy4a.enable false");
      vscode.commands.executeCommand("setContext", "fastpy4a.enable", false);
    }
  };

  vscode.workspace.onDidSaveTextDocument(checkFastdevpy4aProject);
  vscode.workspace.onDidOpenTextDocument(checkFastdevpy4aProject);
  vscode.workspace.onDidChangeWorkspaceFolders(checkFastdevpy4aProject);

  checkFastdevpy4aProject();

  vscode.window.showInformationMessage(
    `fastdev-py4android ${T("extension is active")}`
  );
}
function activate(context) {
  registerCoreCommand(context);
}

function deactivate() {}

exports.activate = activate;
module.exports = {
  activate,
  deactivate,
};
