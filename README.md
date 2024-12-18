
<p align="left">
    English</a>&nbsp ｜ &nbsp<a href="README_CN.md">中文</a>&nbsp
</p>
<br><br> 

![4d64c2fa3aacf65279663e51905653fc](https://github.com/user-attachments/assets/ef84aa2a-04b6-45f8-abf2-a240222686ac)

# fastdev-py4a-vscode-extension
Use some unconventional methods to develop Android apps in Python within VS Code. It is suitable for the rapid implementation of personal tools or prototypes and for personal learning purposes. Use it cautiously in production environments, and it cannot be published on app stores such as Google Play.


## Features/Dependencies
- There's no need to install Android Studio. You can directly use VS Code for development.
- Requires [Java Runtime Environment](https://www.java.com/en/download/).
- Currently, only Windows => apk (armv8) is supported.
- No root permission is required. Use proot to enter the Debian environment to start the Python server program.
- Python version 3.11 is used.
- The UI is implemented using webview.
- Use the upload component [LuckSiege/PictureSelector](https://github.com/LuckSiege/PictureSelector)


## Usage
#### 1. Install the VSIX installation package in the releases.
#### 2. Create a project folder and open it using VS Code.
#### 3. Open the feature interface on the sidebar. For the first run, it is necessary to "Initialize Environment", and then click on "Create Project" at the top. 
![image](https://github.com/user-attachments/assets/bfd9d27c-63bf-4ca5-8ed8-e4cc4e373e30)
#### 4. Use adb to connect to the device. Once the connection is successful, the device can be seen, and then click on "Build Install Run (Full Package)". 
![image](https://github.com/user-attachments/assets/150392cb-8609-4374-9806-164ad952ccd9)



## Related to the base APK
- [fastdev-py4a-base](https://github.com/PurplePotatoTools/fastdev-py4a-base) , After being packaged into an APK, it is used as a base unpacking program.
- Some tools, including ssh/sftp/webtty , have been simply implemented using [ppobox](https://github.com/PurplePotatoTools/ppobox).


## Other details
- Use Apktool to unpack and repack APK.
- Use AnotherTermShellPlugin-Android10Essentials to use the shell through proot on Android 10 and above without root permission.
- Use flatbuffers as the communication protocol between Python and Java.
- Use PictureSelector as the image selector.
- Use the python image from arm64v8/python:3.11-slim-bookworm.


## References
- [green-green-avk/AnotherTermShellPlugin-Android10Essentials](https://github.com/green-green-avk/AnotherTermShellPlugin-Android10Essentials)
- [google/flatbuffers](https://github.com/google/flatbuffers)
- [LuckSiege/PictureSelector](https://github.com/LuckSiege/PictureSelector)
- [iBotPeaches/Apktool](https://github.com/iBotPeaches/Apktool)
- [python:3.11-slim-bookworm](https://hub.docker.com/layers/arm64v8/python/3.11-slim-bookworm/images/sha256-383da0c9c870cbbfca5b55e1283343ddbecf0b2247a0a258ab016d87ed374445)