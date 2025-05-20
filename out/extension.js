"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const fs = require("fs");
const os = require("os");
async function fileExists(path) {
    try {
        await fs.promises.access(path, fs.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
function executeCommand(path) {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let command;
        if (platform === 'win32') {
            command = `start "" "${path}"`;
        }
        else if (platform === 'darwin') {
            command = `open "${path}"`;
        }
        else {
            command = `xdg-open "${path}"`;
        }
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Ошибка выполнения: ${error.message}`));
                return;
            }
            if (stderr) {
                reject(new Error(`Ошибка команды: ${stderr}`));
                return;
            }
            resolve();
        });
    });
}
function activate(context) {
    const provider = new DayZLauncherProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(DayZLauncherProvider.viewType, provider));
}
exports.activate = activate;
class DayZLauncherProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            try {
                switch (data.command) {
                    case 'launch': {
                        const shortcutPath = vscode.workspace.getConfiguration('rzDevDayzLauncher').get(data.target);
                        if (!shortcutPath) {
                            throw new Error(`Путь для "${data.target}" не задан`);
                        }
                        if (!await fileExists(shortcutPath)) {
                            throw new Error(`Файл не найден: ${shortcutPath}`);
                        }
                        await executeCommand(shortcutPath);
                        break;
                    }
                    case 'openConfig': {
                        const configPath = vscode.workspace.getConfiguration('rzDevDayzLauncher').get('configFilePath');
                        if (!configPath) {
                            throw new Error('Путь к конфигу не задан');
                        }
                        if (!await fileExists(configPath)) {
                            throw new Error(`Конфиг не найден: ${configPath}`);
                        }
                        const doc = await vscode.workspace.openTextDocument(configPath);
                        await vscode.window.showTextDocument(doc, { preview: false });
                        break;
                    }
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(error.message);
                }
            }
        });
    }
    getHtml(webview) {
        var _a, _b, _c, _d, _e, _f;
        const config = vscode.workspace.getConfiguration('rzDevDayzLauncher');
        const btnLabelStartServerClient = (_a = config.get('btnLabelStartServerClient')) !== null && _a !== void 0 ? _a : '🚀 Сервер+Клиент';
        const btnLabelStopServerClient = (_b = config.get('btnLabelStopServerClient')) !== null && _b !== void 0 ? _b : '⛔ Остановить всё';
        const btnLabelStartServer = (_c = config.get('btnLabelStartServer')) !== null && _c !== void 0 ? _c : '🟢 Сервер 🌐';
        const btnLabelStopServer = (_d = config.get('btnLabelStopServer')) !== null && _d !== void 0 ? _d : '🔴 Остановить Сервер 🌐';
        const btnLabelStartClient = (_e = config.get('btnLabelStartClient')) !== null && _e !== void 0 ? _e : '🟢 Клиент 🖥️';
        const btnLabelStopClient = (_f = config.get('btnLabelStopClient')) !== null && _f !== void 0 ? _f : '🔴 Остановить Клиент 🖥️';
        return `
        <!DOCTYPE html>
        <html lang="ru">
        <body>
            <h2 style="color:#bbb; letter-spacing:2px; font-weight:200;">Панель управления</h2>
            <button class="dz-btn dz-green" onclick="launch('startServerClient')">${btnLabelStartServerClient}</button>
            <button class="dz-btn dz-red" onclick="launch('stopServerClient')">${btnLabelStopServerClient}</button>
            <button class="dz-btn dz-green" onclick="launch('startServer')">${btnLabelStartServer}</button>
            <button class="dz-btn dz-red" onclick="launch('stopServer')">${btnLabelStopServer}</button>
            <button class="dz-btn dz-green" onclick="launch('startClient')">${btnLabelStartClient}</button>
            <button class="dz-btn dz-red" onclick="launch('stopClient')">${btnLabelStopClient}</button>
            <h2 style="color:#bbb; letter-spacing:2px; font-weight:200;">Настройка</h2>
            <button class="dz-btn dz-blue" onclick="launch('openConfig')">⚙️ Параметры конфига</button>
            <style>
                body {
                    background: #181818;
                    margin: 0;
                    padding: 2px;
                    font-family: Segoe UI, Arial, sans-serif;
                }
                .dz-btn {
                    display: block;
                    width: 100%;
                    margin: 14px 0 0;
                    padding: 13px 0;
                    font-size: 16px;
                    font-weight: 600;
                    background: #25282c;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px #0001;
                    cursor: pointer;
                    outline: none;
                    transition: background 0.15s, box-shadow 0.15s;
                    letter-spacing: 0.5px;
                }
                .dz-btn:hover {
                    background: #32353a;
                    box-shadow: 0 4px 16px #0003;
                }
                .dz-btn.dz-green {
                    background: #2b3e2d;
                }
                .dz-btn.dz-green:hover {
                    background: #37543a;
                }
                .dz-btn.dz-red {
                    background: #463031;
                }
                .dz-btn.dz-red:hover {
                    background: #6c4040;
                }
                .dz-btn.dz-blue {
                    background: #264b5d;
                }
                .dz-btn.dz-blue:hover {
                    background: #34739a;
                }
            </style>
            <script>
                const vscode = acquireVsCodeApi();
                function launch(target) {
                    if (target === 'openConfig') {
                        vscode.postMessage({ command: 'openConfig' });
                    } else {
                        vscode.postMessage({ command: 'launch', target });
                    }
                }
            </script>
        </body>
        </html>`;
    }
}
DayZLauncherProvider.viewType = 'rzDevDayzLauncher.panel';
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map