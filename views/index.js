const vscode = acquireVsCodeApi();
var app = new Vue({
    el: "#app",
    data: {
        lang: navigator.language.toLocaleLowerCase(),
        zh: {
            "Create Project": "初始化项目",
            "Patch Fast Run": "快速增量运行",
            "Build Install Run (Full Package)": "构建安装运行(完整打包)",
            "Running": "运行中",
            "Clean Build Cache": "清理构建缓存空间",
            "Initialize Environment": "初始化工具和环境",
            "Dependency Download": "依赖下载",
            "App Name": "应用名称",
            "Package Name": "包名",
            "Version Name": "版本名",
            "Version Code": "版本代码",
            "Rootfs": "rootfs镜像路径",
            "Icon": "图标",
            "Icon Text": "图标文字",
            "Icon Preview": "图标预览",
            "Save": "保存",
            "Can't find app.json, please initialize the workspace first": "找不到app.json, 请先初始化工作区",
            "Devices": "设备",
            "No Devices :You need to try adb connect to connect to the device": "没有设备: 你需要尝试adb connect连接设备",
            "Refresh Config": "刷新配置",
            "Save Config": "保存配置",
            "More Settings": "更多设置",
        },
        app_info: {
            app_name: "",
            package: "",
            version_name: "",
            version_code: "",
            icon: "",
            icon_text: "",
            dev_mode: true,
            rootfs: "",
            foreground_service: {},
            system: {},
        },
        dependency: "opencv-python-headless",
        is_workfolder_init: false,
        is_run: false,
        is_init_tools: false,
        is_global_locker: true,
        service_info: {},
        adb_info: {},
        rootfs_list: [],
    },
    methods: {
        command(command, args) {
            if (command === "extension.FastdevPy4a.DependencyInstallation") {
                args = { dependency: this.dependency };
            }
            vscode.postMessage({ command, args });
            // extension.FastdevPy4a
            if (command.indexOf("extension.FastdevPy4a") === 0) {
                app.is_global_locker = true;
            }
        },
    },
});

function objcompare(a, b) {
    let ajson = JSON.stringify(a);
    let bjson = JSON.stringify(b);
    if (ajson === bjson) {
        return false;
    }
    return true;
}

window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
        case "get_app_info":
            var app_info = message?.data;
            if (app_info) {
                app.app_info = app_info;
            }
            break;
        case "all_info":
            app.service_info = message?.data;

            app.is_workfolder_init = message?.data?.is_workfolder_init;

            var is_init_tools = message?.data?.is_init_tools;
            app.is_init_tools = is_init_tools;

            var adb_info = message?.data?.adb_info;
            if (adb_info) {
                if (objcompare(app.adb_info, adb_info)) {
                    app.adb_info = adb_info;
                }
            }

            app.rootfs_list = message?.data?.rootfs_list;
            if (app.app_info.rootfs === "" && app.rootfs_list && app.rootfs_list.length > 0) {
                app.app_info.rootfs = app.rootfs_list[0];
            }

            var is_global_locker = message?.data?.is_global_locker;
            if (is_global_locker === undefined) {
                is_global_locker = false;
            }
            app.is_global_locker = is_global_locker;

            break;
    }
});
 

app.command("get_app_info");
app.command("all_info");
