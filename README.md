
# fastdev-py4a-vscode-extension
Use some unconventional methods to develop Android apps in Python within VS Code. It is suitable for the rapid implementation of personal tools or prototypes and for personal learning purposes. Use it cautiously in production environments, and it cannot be published on app stores such as Google Play.


## Features/Dependencies
- Currently, only Windows => apk (armv8) is supported.
- There's no need to install Android Studio. You can directly use VS Code for development.
- No root permission is required. Use proot to enter the Debian environment to start the Python server program.
- Python version 3.11 is used.
- The interface is implemented using webview.
- SDK Platform-Tools are needed, mainly the adb.exe in it. [It can be downloaded here.](https://developer.android.google.cn/tools/releases/platform-tools)



## Usage
#### 0. Verify that adb can be used.
![image](https://github.com/user-attachments/assets/539c4570-7e95-4ebc-aa8c-429b785afd32)

#### 1. Install the VSIX installation package in the releases.
#### 2. Create a project folder and open it using VS Code.
#### 3. Open the feature interface on the sidebar. For the first run, it is necessary to initialize the tools and the environment, and then click on "Create Project" at the top. 
#### 4. Use adb to connect to the device. Once the connection is successful, the device can be seen, and then click on "Build Install Run (Full Package)". 



