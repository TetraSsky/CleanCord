/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors*
* SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Menu } from "@webpack/common";
import { React } from "@webpack/common";
import { HiddenItemsList } from "./hiddenItemsList";

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

            const toggle = React.useCallback((serverId: string) => {
                const newItems = hiddenServers.includes(serverId)
                    ? hiddenServers.filter(id => id !== serverId)
                    : [...hiddenServers, serverId];
                setHiddenServers(newItems);
                hiddenData.servers = newItems;
                saveHiddenData();
                updateCSSClasses();
            }, [hiddenServers]);

            const clearAll = React.useCallback(() => {
                setHiddenServers([]);
                hiddenData.servers = [];
                saveHiddenData();
                updateCSSClasses();
            }, []);

        return React.createElement(HiddenItemsList, {
            type: "server",
            items: hiddenServers,
            onToggle: toggle,
            onClearAll: clearAll,
            onlyHideInStreamEnabled: settings.store.onlyHideInStream
        });
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

            const toggle = React.useCallback((folderId: string) => {
                const newItems = hiddenFolders.includes(folderId)
                    ? hiddenFolders.filter(id => id !== folderId)
                    : [...hiddenFolders, folderId];
                setHiddenFolders(newItems);
                hiddenData.folders = newItems;
                saveHiddenData();
                updateCSSClasses();
            }, [hiddenFolders]);

            const clearAll = React.useCallback(() => {
                setHiddenFolders([]);
                hiddenData.folders = [];
                saveHiddenData();
                updateCSSClasses();
            }, []);

            return React.createElement(HiddenItemsList, {
                type: "folder",
                items: hiddenFolders,
                onToggle: toggle,
                onClearAll: clearAll,
                onlyHideInStreamEnabled: settings.store.onlyHideInStream
            });
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

    contextMenus: {
        "guild-context"(children, { guild, folderId }) {
            if (!settings.store.showOptions) return;
            if (!guild && !folderId) return;

            const isHidden = guild ? hiddenData.servers.includes(guild.id) : hiddenData.folders.includes(folderId);
            const label = guild
                ? (isHidden ? "Unhide Server" : "Hide Server")
                : (isHidden ? "Unhide Folder" : "Hide Folder"); //We don't really need this btw, but its useful for debugging :) | Also in the case "onlyHideInStream" = true, this behavior needs to stay

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
                    label="Manage Hidden Folders & Servers"
                    action={() => {
                        Vencord.Webpack.Common.SettingsRouter.open("VencordPlugins"); // Opens the Vencord settings panel, need to find a way to redirect to CleanCord's settings (Not implemented yet)
                    }}
                />
            );
        }
    }
});
