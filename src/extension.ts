import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

async function fileExists(path: string): Promise<boolean> {
    try {
        await fs.promises.access(path, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function executeCommand(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let command: string;

        if (platform === 'win32') {
            command = `start "" "${path}"`;
        } else if (platform === 'darwin') {
            command = `open "${path}"`;
        } else {
            command = `xdg-open "${path}"`;
        }

        exec(command, (error, stdout, stderr) => {
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

export function activate(context: vscode.ExtensionContext) {
    const provider = new DayZLauncherProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(DayZLauncherProvider.viewType, provider)
    );
}

class DayZLauncherProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'rzDevDayzLauncher.panel';

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async data => {
            try {
                switch (data.command) {
                    case 'launch': {
                        const shortcutPath = vscode.workspace.getConfiguration('rzDevDayzLauncher').get<string>(data.target);
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
                        const configPath = vscode.workspace.getConfiguration('rzDevDayzLauncher').get<string>('configFilePath');
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
            } catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(error.message);
                }
            }
        });
    }

    private getHtml(webview: vscode.Webview): string {
        const config = vscode.workspace.getConfiguration('rzDevDayzLauncher');
        const btnLabelStartServerClient = config.get<string>('btnLabelStartServerClient') ?? '🚀 Сервер+Клиент';
        const btnLabelStopServerClient = config.get<string>('btnLabelStopServerClient') ?? '⛔ Остановить всё';
        const btnLabelStartServer = config.get<string>('btnLabelStartServer') ?? '🟢 Сервер 🌐';
        const btnLabelStopServer = config.get<string>('btnLabelStopServer') ?? '🔴 Остановить Сервер 🌐';
        const btnLabelStartClient = config.get<string>('btnLabelStartClient') ?? '🟢 Клиент 🖥️';
        const btnLabelStopClient = config.get<string>('btnLabelStopClient') ?? '🔴 Остановить Клиент 🖥️';

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

export function deactivate() {}