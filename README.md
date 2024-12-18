![4d64c2fa3aacf65279663e51905653fc](https://github.com/user-attachments/assets/ef84aa2a-04b6-45f8-abf2-a240222686ac)

# fastdev-py4a-vscode-extension
Use some unconventional methods to develop Android apps in Python within VS Code. It is suitable for the rapid implementation of personal tools or prototypes and for personal learning purposes. Use it cautiously in production environments, and it cannot be published on app stores such as Google Play.


## Features/Dependencies
- Currently, only Windows => apk (armv8) is supported.
- There's no need to install Android Studio. You can directly use VS Code for development.
- No root permission is required. Use proot to enter the Debian environment to start the Python server program.
- Python version 3.11 is used.
- The interface is implemented using webview.



## Usage
#### 1. Install the VSIX installation package in the releases.
#### 2. Create a project folder and open it using VS Code.
#### 3. Open the feature interface on the sidebar. For the first run, it is necessary to "Initialize Environment", and then click on "Create Project" at the top. 
![image](https://github.com/user-attachments/assets/bfd9d27c-63bf-4ca5-8ed8-e4cc4e373e30)

#### 4. Use adb to connect to the device. Once the connection is successful, the device can be seen, and then click on "Build Install Run (Full Package)". 
![image](https://github.com/user-attachments/assets/150392cb-8609-4374-9806-164ad952ccd9)




