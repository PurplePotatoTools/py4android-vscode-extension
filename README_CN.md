![image](https://github.com/user-attachments/assets/7732fc10-34e7-4665-90b5-42eb36533e37)

# fastdev-py4a-vscode-extension
借助一些非常规方式实现在vscode中使用python开发android app, 适用个人工具或者原型的快速实现和个人学习使用, 谨慎用于生产环境, [无法在google play等应用商店发布](https://github.com/green-green-avk/AnotherTermShellPlugin-Android10Essentials)


## 特点/依赖
- 无需安装Android Studio, 直接使用vscode开发
- 至少需要[java运行环境](https://www.java.com/en/download/)
- 目前仅支持windows => apk(armv8)
- 无需root权限, 使用proot进入debian环境来启动python服务端程序
- python版本3.11
- 使用webview实现界面
- 使用上传组件[LuckSiege/PictureSelector](https://github.com/LuckSiege/PictureSelector)



## 使用
#### 1. 安装releases中的VSIX安装包
#### 2. 创建项目文件夹使用vscode打开
#### 3. 在侧边栏打开功能界面, 第一次运行需要初始化工具和环境, 然后点击上方的初始化项目
![image](https://github.com/user-attachments/assets/ae3974f9-c5c1-41ce-aa12-554f60e6e930)
#### 4. 使用adb连接设备, 成功连接后可以看到设备, 并点击构建安装运行
![image](https://github.com/user-attachments/assets/ac5608bd-dca2-473e-837a-f02e13af46ef)

## 基础apk相关
- [fastdev-py4a-base](https://github.com/PurplePotatoTools/fastdev-py4a-base) , 打包成apk后作为基础解包程序
- 使用 [ppobox](https://github.com/PurplePotatoTools/ppobox) 简单实现了一些工具, 包括ssh,sftp,webtty 等

## 相关技术
- Apktool解包和打包apk
- 使用AnotherTermShellPlugin-Android10Essentials, 在Android 10以上通过proot使用shell, 无需root权限
- flatbuffers作为python和java之间的通信协议
- PictureSelector作为图片选择器
- 来自arm64v8/python:3.11-slim-bookworm的python镜像

## 参考
- [green-green-avk/AnotherTermShellPlugin-Android10Essentials](https://github.com/green-green-avk/AnotherTermShellPlugin-Android10Essentials)
- [google/flatbuffers](https://github.com/google/flatbuffers)
- [LuckSiege/PictureSelector](https://github.com/LuckSiege/PictureSelector)
- [iBotPeaches/Apktool](https://github.com/iBotPeaches/Apktool)
- [python:3.11-slim-bookworm](https://hub.docker.com/layers/arm64v8/python/3.11-slim-bookworm/images/sha256-383da0c9c870cbbfca5b55e1283343ddbecf0b2247a0a258ab016d87ed374445)

## Contact
如果你有其他想了解或者技术交流, 可以通过以下方式联系我:
- 微信号 minrszone