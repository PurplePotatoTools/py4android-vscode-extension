![image](https://github.com/user-attachments/assets/7732fc10-34e7-4665-90b5-42eb36533e37)

# fastdev-py4a-vscode-extension
借助一些非常规方式实现在vscode中使用python开发android app, 适用个人工具或者原型的快速实现, 谨慎用于生产环境, 无法在google play等应用商店发布


## 特点/依赖
- 目前仅支持windows => apk(armv8)
- 无需安装Android Studio, 直接使用vscode开发
- 无需root权限, 使用proot进入debian环境来启动python服务端程序
- python版本3.11
- 使用webview实现界面
- 需要SDK Platform-Tools, 主要是其中的adb.exe, [可以在此处下载](https://developer.android.google.cn/tools/releases/platform-tools)



## 使用
#### 0. 确认adb可以使用
![image](https://github.com/user-attachments/assets/539c4570-7e95-4ebc-aa8c-429b785afd32)


#### 1. 安装releases中的VSIX安装包
#### 2. 创建项目文件夹使用vscode打开
#### 3. 在侧边栏打开功能界面, 第一次运行需要初始化工具和环境, 然后点击上方的初始化项目
![image](https://github.com/user-attachments/assets/ae3974f9-c5c1-41ce-aa12-554f60e6e930)
#### 4. 使用adb连接设备, 成功连接后可以看到设备, 并点击构建安装运行
![image](https://github.com/user-attachments/assets/ac5608bd-dca2-473e-837a-f02e13af46ef)



