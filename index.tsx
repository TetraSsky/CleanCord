import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Menu } from "@webpack/common";
import { React } from "@webpack/common";

interface HiddenData {
    servers: string[];
    folders: string[];
}

const logger = new Logger("CleanCord");
let hiddenData: HiddenData = { servers: [], folders: [] };

// ===============================
// PLUGIN SETTINGS CONFIGURATION =
// ===============================
const settings = definePluginSettings({
    // CleanCord : Options CATEGORY
    showOptions: {
        description: "Displays the options upon right-clicking a server/folder",
        type: OptionType.BOOLEAN,
        default: true,
    },

    onlyHideInStream: {
        description: "Only hide selected servers while in Streamer Mode",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: (newValue: boolean) => {
            const plugin = Vencord.Plugins.plugins.CleanCord;
            if (plugin) {
                plugin.updateStreamerModeListener();
            }
            updateCSSClasses();
        }
    },

    // CleanCord : Servers CATEGORY
    hiddenServers: {
        description: "Manage hidden servers (toggle to show/hide)",
        type: OptionType.COMPONENT,
        component: () => {
            const [hiddenServers, setHiddenServers] = React.useState<string[]>([]);

            React.useEffect(() => {
                loadHiddenData();
                setHiddenServers([...hiddenData.servers]);
            }, []);

            const toggleServerVisibility = React.useCallback((serverId: string) => {
                const newHiddenServers = hiddenServers.includes(serverId)
                    ? hiddenServers.filter(id => id !== serverId)
                    : [...hiddenServers, serverId];

                setHiddenServers(newHiddenServers);
                hiddenData.servers = newHiddenServers;
                saveHiddenData();
                updateCSSClasses();
            }, [hiddenServers]);

            const clearAllHidden = React.useCallback(() => {
                setHiddenServers([]);
                hiddenData.servers = [];
                saveHiddenData();
                updateCSSClasses();
            }, []);

            const isStreamMode = Vencord.Plugins.plugins.CleanCord?.isStreamingMode() ?? false;
            const onlyHideInStreamEnabled = settings.store.onlyHideInStream;

            const containerStyle = React.useMemo(() => ({
                padding: "10px",
                backgroundColor: "var(--background-secondary)",
                borderRadius: "8px",
                marginTop: "8px"
            }), []);

            const headerStyle = React.useMemo(() => ({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px"
            }), []);

            const buttonStyle = React.useMemo(() => ({
                padding: "4px 8px",
                backgroundColor: "var(--button-danger-background)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
            }), []);

            const statusStyle = React.useMemo(() => ({
                padding: "8px",
                backgroundColor: isStreamMode ? "var(--status-positive)" : "var(--status-warning)",
                borderRadius: "4px",
                marginBottom: "10px",
                color: "var(--white-500)",
                textAlign: "center" as const
            }), [isStreamMode]);

            return React.createElement("div", {
                style: containerStyle
            }, [
                React.createElement("div", {
                    key: "header",
                    style: headerStyle
                }, [
                    React.createElement("h3", {
                        key: "title",
                        style: { margin: 0, color: "var(--header-primary)" }
                    }, "Hidden Servers"),
                    React.createElement("button", {
                        key: "clear-button",
                        onClick: clearAllHidden,
                        style: buttonStyle
                    }, "Unhide All")
                ]),

                onlyHideInStreamEnabled ? React.createElement("div", {
                    key: "stream-status",
                    style: statusStyle
                }, isStreamMode
                    ? "🔴 Streamer Mode ON - Servers are hidden"
                    : "⚠️ Streamer Mode OFF - Servers are visible despite being in list"
                ) : null,
                React.createElement("div", {
                    key: "server-list",
                    style: { maxHeight: "300px", overflowY: "auto" }
                }, hiddenServers.length === 0
                    ? React.createElement("div", {
                        style: {
                            textAlign: "center",
                            color: "var(--text-muted)",
                            padding: "20px"
                        }
                    }, "No hidden servers. Right-click on a server to hide it.")
                    : hiddenServers.map(serverId =>
                        React.createElement("div", {
                            key: serverId,
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: "1px solid var(--background-modifier-accent)",
                                opacity: onlyHideInStreamEnabled && !isStreamMode ? 0.5 : 1
                            }
                        }, [
                            React.createElement("span", {
                                key: "server-id",
                                style: {
                                    color: "var(--text-danger)",
                                }
                            }, `Server ID: ${serverId}`),
                            React.createElement("label", {
                                key: "toggle-wrapper",
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    cursor: "pointer"
                                }
                            }, [
                                React.createElement("span", {
                                    key: "toggle-label",
                                    style: {
                                        color: "var(--text-muted)"
                                    }
                                }, "Hidden"),
                                React.createElement("input", {
                                    key: "toggle-input",
                                    type: "checkbox",
                                    checked: true,
                                    onChange: () => toggleServerVisibility(serverId),
                                    style: { cursor: "pointer" }
                                })
                            ])
                        ])
                    )
                )
            ]);
        }
    },

    // CleanCord : Folders CATEGORY
    hiddenFolders: {
        description: "Manage hidden folders (toggle to show/hide)",
        type: OptionType.COMPONENT,
        component: () => {
            const [hiddenFolders, setHiddenFolders] = React.useState<string[]>([]);

            React.useEffect(() => {
                loadHiddenData();
                setHiddenFolders([...hiddenData.folders]);
            }, []);

            const toggleFolderVisibility = React.useCallback((folderId: string) => {
                const newHiddenFolders = hiddenFolders.includes(folderId)
                    ? hiddenFolders.filter(id => id !== folderId)
                    : [...hiddenFolders, folderId];

                setHiddenFolders(newHiddenFolders);
                hiddenData.folders = newHiddenFolders;
                saveHiddenData();
                updateCSSClasses();
            }, [hiddenFolders]);

            const clearAllHidden = React.useCallback(() => {
                setHiddenFolders([]);
                hiddenData.folders = [];
                saveHiddenData();
                updateCSSClasses();
            }, []);

            const isStreamMode = Vencord.Plugins.plugins.CleanCord?.isStreamingMode() ?? false;
            const onlyHideInStreamEnabled = settings.store.onlyHideInStream;

            const containerStyle = React.useMemo(() => ({
                padding: "10px",
                backgroundColor: "var(--background-secondary)",
                borderRadius: "8px",
                marginTop: "8px"
            }), []);

            const headerStyle = React.useMemo(() => ({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px"
            }), []);

            const buttonStyle = React.useMemo(() => ({
                padding: "4px 8px",
                backgroundColor: "var(--button-danger-background)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
            }), []);

            const statusStyle = React.useMemo(() => ({
                padding: "8px",
                backgroundColor: isStreamMode ? "var(--status-positive)" : "var(--status-warning)",
                borderRadius: "4px",
                marginBottom: "10px",
                color: "var(--white-500)",
                textAlign: "center" as const
            }), [isStreamMode]);

            return React.createElement("div", {
                style: containerStyle
            }, [
                React.createElement("div", {
                    key: "header",
                    style: headerStyle
                }, [
                    React.createElement("h3", {
                        key: "title",
                        style: { margin: 0, color: "var(--header-primary)" }
                    }, "Hidden Folders"),
                    React.createElement("button", {
                        key: "clear-button",
                        onClick: clearAllHidden,
                        style: buttonStyle
                    }, "Unhide All")
                ]),

                onlyHideInStreamEnabled ? React.createElement("div", {
                    key: "stream-status",
                    style: statusStyle
                }, isStreamMode
                    ? "🔴 Streamer Mode ON - Folders are hidden"
                    : "⚠️ Streamer Mode OFF - Folders are visible despite being in list"
                ) : null,
                React.createElement("div", {
                    key: "folder-list",
                    style: { maxHeight: "300px", overflowY: "auto" }
                }, hiddenFolders.length === 0
                    ? React.createElement("div", {
                        style: {
                            textAlign: "center",
                            color: "var(--text-muted)",
                            padding: "20px"
                        }
                    }, "No hidden folders. Right-click on a folder to hide it.")
                    : hiddenFolders.map(folderId =>
                        React.createElement("div", {
                            key: folderId,
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: "1px solid var(--background-modifier-accent)",
                                opacity: onlyHideInStreamEnabled && !isStreamMode ? 0.5 : 1
                            }
                        }, [
                            React.createElement("span", {
                                key: "folder-id",
                                style: {
                                    color: "var(--text-danger)",
                                }
                            }, `Folder ID: ${folderId}`),
                            React.createElement("label", {
                                key: "toggle-wrapper",
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    cursor: "pointer"
                                }
                            }, [
                                React.createElement("span", {
                                    key: "toggle-label",
                                    style: {
                                        color: "var(--text-muted)"
                                    }
                                }, "Hidden"),
                                React.createElement("input", {
                                    key: "toggle-input",
                                    type: "checkbox",
                                    checked: true,
                                    onChange: () => toggleFolderVisibility(folderId),
                                    style: { cursor: "pointer" }
                                })
                            ])
                        ])
                    )
                )
            ]);
        }
    }
});

// ===========================
// DATA MANAGEMENT FUNCTIONS =
// ===========================
function loadHiddenData() {
    try {
        const storedServers = settings.store.hiddenServers;
        const storedFolders = settings.store.hiddenFolders;

        const servers = storedServers ? JSON.parse(storedServers) : [];
        const folders = storedFolders ? JSON.parse(storedFolders) : [];

        hiddenData = { servers, folders };
    } catch (e) {
        logger.error("Failed to load hidden data:", e);
        hiddenData = { servers: [], folders: [] };
    }
}

function saveHiddenData() {
    try {
        settings.store.hiddenServers = JSON.stringify(hiddenData.servers);
        settings.store.hiddenFolders = JSON.stringify(hiddenData.folders);
    } catch (e) {
        logger.error("Failed to save hidden data:", e);
    }
}

// ==========================
// CSS MANAGEMENT FUNCTIONS =
// ==========================
const CSS_ELEMENT_ID = 'clean-cord-dynamic-styles';

function updateCSSClasses() {
    const shouldHide = !settings.store.onlyHideInStream || Vencord.Plugins.plugins.CleanCord?.isStreamingMode();
    document.documentElement.setAttribute('data-clean-cord-enabled', shouldHide.toString());

    let styleElement = document.getElementById(CSS_ELEMENT_ID) as HTMLStyleElement;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = CSS_ELEMENT_ID;
        document.head.appendChild(styleElement);
    }

    if (!shouldHide) {
        styleElement.textContent = '';
        return;
    }

    const cssRules: string[] = [];

    hiddenData.servers.forEach(serverId => {
        cssRules.push(
            `html[data-clean-cord-enabled="true"] .listItem__650eb:has([data-list-item-id="guildsnav___${serverId}"]) { display: none !important; }`,
            `html[data-clean-cord-enabled="true"] [data-list-item-id="guildsnav___${serverId}"] { display: none !important; }`
        );
    });

    hiddenData.folders.forEach(folderId => {
        cssRules.push(
            `html[data-clean-cord-enabled="true"] .listItem__650eb:has([data-list-item-id*="${folderId}"]) { display: none !important; }`,
            `html[data-clean-cord-enabled="true"] [data-list-item-id*="${folderId}"] { display: none !important; }`
        );
    });

    styleElement.textContent = cssRules.join('\n');
}

// =================================
// VISIBILITY MANAGEMENT FUNCTIONS =
// =================================
function toggleServer(serverId: string) {
    if (!serverId) return;

    const index = hiddenData.servers.indexOf(serverId);
    if (index > -1) {
        hiddenData.servers.splice(index, 1);
    } else {
        hiddenData.servers.push(serverId);
    }

    saveHiddenData();
    updateCSSClasses();
}

function toggleFolder(folderId: string) {
    if (!folderId) return;

    const index = hiddenData.folders.indexOf(folderId);
    if (index > -1) {
        hiddenData.folders.splice(index, 1);
    } else {
        hiddenData.folders.push(folderId);
    }

    saveHiddenData();
    updateCSSClasses();
}

// =============
// MAIN PLUGIN =
// =============
export default definePlugin({
    name: "CleanCord",
    description: "Allows you to hide certain servers/folders in your server list with right-click option",
    authors: [{ name: "Tetra_Sky", id: 406453997294190594n }],
    settings,

    streamerModeStore: null as any,
    streamerModeListener: null as (() => void) | null,

    start() {
        loadHiddenData();
        this.streamerModeStore = Vencord.Webpack.findStore("StreamerModeStore") || Vencord.Webpack.getByProps("StreamerModeStore")?.StreamerModeStore;
        this.updateStreamerModeListener();
        updateCSSClasses();
    },

    stop() {
        this.removeStreamerModeListener();

        const styleElement = document.getElementById(CSS_ELEMENT_ID);
        if (styleElement) {
            styleElement.remove();
        }

        document.documentElement.removeAttribute('data-clean-cord-enabled');
    },

    isStreamingMode() {
        if (!this.streamerModeStore) return false;
        try {
            return this.streamerModeStore.enabled;
        } catch (e) {
            logger.error("Error checking streamer mode:", e);
            return false;
        }
    },

    updateStreamerModeListener() {
        this.removeStreamerModeListener();
        if (settings.store.onlyHideInStream && this.streamerModeStore) {
            this.streamerModeListener = () => updateCSSClasses();
            this.streamerModeStore.addChangeListener(this.streamerModeListener);
        }
    },

    removeStreamerModeListener() {
        if (this.streamerModeStore && this.streamerModeListener) {
            this.streamerModeStore.removeChangeListener(this.streamerModeListener);
            this.streamerModeListener = null;
        }
    },

    patches: [
        {
            find: '"getGuildsTree(){',
            replacement: {
                match: /(?<=getGuildsTree\(\)\{)(.+?return)(.+?)(?=;)/,
                replace: (_, rest, returnValue) => `${rest} $self.filterGuildsTree(${returnValue})`
            }
        }
    ],

    contextMenus: {
        "guild-context"(children, { guild, folderId }) {
            if (!settings.store.showOptions) return;
            if (!guild && !folderId) return;

            const isHidden = guild ? hiddenData.servers.includes(guild.id) : hiddenData.folders.includes(folderId);
            const label = guild
                ? (isHidden ? "Unhide Server" : "Hide Server")
                : (isHidden ? "Unhide Folder" : "Hide Folder"); //We don't really need this btw, but its useful for debugging :)

            children.push(
                <Menu.MenuSeparator />,
                <Menu.MenuItem
                    id="clean-cord-toggle"
                    label={label}
                    action={() => {
                        if (guild) {
                            toggleServer(guild.id);
                        } else if (folderId) {
                            toggleFolder(folderId);
                        }
                    }}
                />
            );

            children.push(
                <Menu.MenuItem
                    id="clean-cord-manage"
                    label="Manage Hidden Servers"
                    action={() => {
                        Vencord.Webpack.Common.SettingsRouter.open("VencordPlugins");
                    }}
                />
            );
        }
    }
});
