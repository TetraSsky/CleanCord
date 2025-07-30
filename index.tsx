/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors*
* SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Menu, FluxDispatcher } from "@webpack/common";
import { React } from "@webpack/common";
import { HiddenItemsList } from "./hiddenItemsList";

interface HiddenData {
    servers: string[];
    folders: string[];
}

const logger = new Logger("CleanCord");
let hiddenData: HiddenData = { servers: [], folders: [] };
let originalDispatch: any = null;

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

    suppressionMode: {
        description: "Select how you want CleanCord to handle notifications from your hidden servers/folders",
        type: OptionType.SELECT,
        options: [
            { label: "Default - Keep initial Discord behaviour for notifications", value: "off" },
            { label: "Silent - Block all notifications in real-time from hidden servers/folders (Resets on startup)", value: "on" },
        ], default: "on", restartNeeded: true,
    },

    autoClearMentions: {
        description: "Automatically clear all unread badges from hidden servers/folders on startup (Recommended to use with 'Silent' mode)",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true
    },

    // CleanCord : DEBUG CATEGORY | Commented out by default
    /*
    debugMode: {
        description: "Cool dev menu option B)",
        type: OptionType.BOOLEAN,
        default: false,
    },
    */

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

// ===============================
// MENTION SUPPRESSION FUNCTIONS =
// ===============================
const suppressionRateLimit = {
    lastSuppression: 0,
    suppressionCount: 0,
    maxSuppressionsPerSecond: 10
};

function checkRateLimit(): boolean {
    if (!settings.store.rateLimitedSuppression) return true;

    const now = Date.now();
    if (now - suppressionRateLimit.lastSuppression > 1000) {
        suppressionRateLimit.suppressionCount = 0;
        suppressionRateLimit.lastSuppression = now;
    }

    if (suppressionRateLimit.suppressionCount >= suppressionRateLimit.maxSuppressionsPerSecond) {
        if (settings.store.debugMode) {
            logger.warn("Rate limit reached. Allowing message through !");
        }
        return false;
    }
    suppressionRateLimit.suppressionCount++;
    return true;
}

function getServersFromHiddenFolders(): string[] {
    const serversInHiddenFolders: string[] = [];

    try {
        const SortedGuildStore = Vencord.Webpack.findStore("SortedGuildStore");

        if (SortedGuildStore && SortedGuildStore.getGuildFolders) {
            const guildFolders = SortedGuildStore.getGuildFolders();

            hiddenData.folders.forEach(hiddenFolderId => {
                const folder = guildFolders.find((folder: any) =>
                    folder.folderId === hiddenFolderId || folder.id === hiddenFolderId
                );

                if (folder && folder.guildIds) {
                    folder.guildIds.forEach((guildId: string) => {
                        if (guildId && !serversInHiddenFolders.includes(guildId)) {
                            serversInHiddenFolders.push(guildId);
                        }
                    });
                }
            });
        }
    } catch (error) {
        logger.error("Error getting servers in hidden folders:", error);
    }

    return serversInHiddenFolders;
}

function shouldSuppressMention(guildId: string): boolean {
    if (settings.store.suppressionMode === "off") return false;
    if (!guildId) return false;

    const isHiddenServer = hiddenData.servers.includes(guildId);
    const serversInHiddenFolders = getServersFromHiddenFolders();
    const isInHiddenFolder = serversInHiddenFolders.includes(guildId);
    const shouldSuppress = isHiddenServer || isInHiddenFolder;

    if (settings.store.onlyHideInStream) {
        const isStreaming = Vencord.Plugins.plugins.CleanCord?.isStreamingMode() ?? false;
        return shouldSuppress && isStreaming;
    }

    return shouldSuppress;
}

function shouldSuppressMessage(action: any): boolean {
    if (!action || typeof action !== 'object') return false;
    if (!checkRateLimit()) return false;

    // Handle - MESSAGE_CREATE (To Prevent : Unread badges, notification sounds and visual indicators)
    if (action.type === 'MESSAGE_CREATE') {
        const message = action.message || action;
        if (settings.store.debugMode) {
            logger.info("MESSAGE_CREATE intercepted:", {
                guildId: message.guild_id,
                channelId: message.channel_id,
                authorId: message.author?.id,
                content: message.content?.substring(0, 50) + "...",
                mentions: message.mentions?.length || 0,
                mentionEveryone: message.mention_everyone,
                type: message.type
            });
        }

        if (message.guild_id && shouldSuppressMention(message.guild_id)) {
            if (settings.store.debugMode) {
                const isDirectlyHidden = hiddenData.servers.includes(message.guild_id);
                const reason = isDirectlyHidden ? "hidden server" : "server in hidden folder";
                const currentUserId = Vencord.Webpack.findStore("UserStore")?.getCurrentUser()?.id;
                const isMentioned = currentUserId && message.mentions ? message.mentions.some((mention: any) => mention.id === currentUserId) : false;

                logger.info(`Suppressing message from ${reason}`, {
                    guildId: message.guild_id,
                    mentioned: isMentioned,
                    everyone: message.mention_everyone,
                    channel: message.channel_id,
                });
            }
            return true;
        }
    }

    // Handle - CHANNEL_UNREAD_UPDATE (To Prevent : Unread updates)
    if (action.type === 'CHANNEL_UNREAD_UPDATE') {
        const guildId = action.guildId;
        if (guildId && shouldSuppressMention(guildId)) {
            if (settings.store.debugMode) {
                const isDirectlyHidden = hiddenData.servers.includes(guildId);
                const reason = isDirectlyHidden ? "hidden server" : "server in hidden folder";
                logger.info(`Suppressing unread update from ${reason}: ${guildId} (mentions: ${action.mentionCount || 0}, unread: ${action.unreadCount || 0})`);
            }
            return true;
        }
    }

    // Handle - MESSAGE_REACTION_ADD (To Prevent : Reactions on messages)
    if (action.type === 'MESSAGE_REACTION_ADD') {
        const guildId = action.guild_id;
        if (guildId && shouldSuppressMention(guildId)) {
            if (settings.store.debugMode) {
                const isDirectlyHidden = hiddenData.servers.includes(guildId);
                const reason = isDirectlyHidden ? "hidden server" : "server in hidden folder";
                logger.info(`Suppressing reaction add from ${reason}: ${guildId}`);
            }
            return true;
        }
    }

    // Handle - MESSAGE_REACTION_REMOVE (To Prevent : Reaction removal notifications)
    if (action.type === 'MESSAGE_REACTION_REMOVE') {
        const guildId = action.guild_id;
        if (guildId && shouldSuppressMention(guildId)) {
            if (settings.store.debugMode) {
                const isDirectlyHidden = hiddenData.servers.includes(guildId);
                const reason = isDirectlyHidden ? "hidden server" : "server in hidden folder";
                logger.info(`Suppressing reaction remove from ${reason}: ${guildId}`);
            }
            return true;
        }
    }

    return false;
}

function patchFluxDispatcher() {
    if (!FluxDispatcher || originalDispatch) return;

    try {
        originalDispatch = FluxDispatcher.dispatch;
        FluxDispatcher.dispatch = function(action: any) {
            if (shouldSuppressMessage(action)) {
                // Return a resolved Promise to maintain Discord's expected behavior (& Prevent crashes)
                return Promise.resolve();
            }

            const result = originalDispatch.call(this, action);

            // We always need to ensure we return a Promise
            if (result && typeof result.then === 'function') {
                return result;
            } else {
                return Promise.resolve(result);
            }
        };

        logger.info("Successfully patched FluxDispatcher for mention suppression");
    } catch (error) {
        logger.error("Failed to patch FluxDispatcher:", error);
    }
}

function unpatchFluxDispatcher() {
    if (!FluxDispatcher || !originalDispatch) return;
    try {
        FluxDispatcher.dispatch = originalDispatch;
        originalDispatch = null;
        logger.info("Restored original FluxDispatcher");
    } catch (error) {
        logger.error("Failed to restore FluxDispatcher:", error);
    }
}

// ===================================
// SELF-CLEARING ON RELOAD FUNCTIONS =
// ===================================
function clearHiddenMentions() {
    if (!settings.store.autoClearMentions) {
        return;
    }

    if (settings.store.onlyHideInStream && Vencord.Plugins.plugins.CleanCord?.isStreamingMode()) {
        try {
            const GuildStore = Vencord.Webpack.findStore("GuildStore") || Vencord.Webpack.findByProps("getGuild", "getGuilds");
            const ChannelStore = Vencord.Webpack.findStore("ChannelStore") || Vencord.Webpack.findByProps("getChannel", "getChannels");
            const ReadStateStore = Vencord.Webpack.findStore("ReadStateStore") || Vencord.Webpack.findByProps("hasUnread", "getMentionCount");

            if (!GuildStore || !ChannelStore || !ReadStateStore) {
                logger.error("Required stores not found for clearing mentions");
                return;
            }

            const serversInHiddenFolders = getServersFromHiddenFolders();
            const allHiddenServerIds = [...new Set([...hiddenData.servers, ...serversInHiddenFolders])];

            if (allHiddenServerIds.length === 0) {
                logger.info("No hidden servers/folders found - nothing to clear !");
                return;
            }

            const channelsToAck: Array<{
                channelId: string;
                messageId: string | null;
                readStateType: number;
            }> = [];

            let totalChannelsChecked = 0;
            let serversProcessed = 0;

            allHiddenServerIds.forEach(guildId => {
                if (!guildId) return;

                try {
                    const guild = GuildStore.getGuild(guildId);
                    if (!guild) {
                        if (settings.store.debugMode) {
                            logger.warn(`Guild ${guildId} not found in GuildStore`);
                        }
                        return;
                    }
                    serversProcessed++;

                    let channels: any[] = [];
                    const GuildChannelStore = Vencord.Webpack.findStore("GuildChannelStore") || Vencord.Webpack.findByProps("getChannels", "getSelectableChannels");

                    if (GuildChannelStore && GuildChannelStore.getChannels) {
                        const guildChannels = GuildChannelStore.getChannels(guildId);
                        if (guildChannels && guildChannels.SELECTABLE) {
                            channels = guildChannels.SELECTABLE.map((item: any) => item.channel).filter(Boolean);
                        }
                    }

                    if (settings.store.debugMode) {
                        logger.info(`Processing guild ${guild.name || guildId}: found ${channels.length} channels`);
                    }

                    channels.forEach((channel: any) => {
                        if (!channel?.id || channel.id === guildId) return;

                        totalChannelsChecked++;

                        const guildMuted = isGuildMuted(guildId);

                        if (guildMuted) {

                            const mentionCount = ReadStateStore.getMentionCount ? ReadStateStore.getMentionCount(channel.id) : 0;

                            if (mentionCount > 0) {
                                const lastMessageId = ReadStateStore.lastMessageId ? ReadStateStore.lastMessageId(channel.id) : null;

                                channelsToAck.push({
                                    channelId: channel.id,
                                    messageId: lastMessageId,
                                    readStateType: 0
                                });

                                if (settings.store.debugMode) {
                                    logger.info("Found mentions in muted guild channel :", {
                                        channelName: channel.name,
                                        channelId: channel.id,
                                        mentionCount: mentionCount,
                                        lastMessageId: lastMessageId
                                    });
                                }
                            }
                        } else {
                            const hasUnread = ReadStateStore.hasUnread && ReadStateStore.hasUnread(channel.id);
                            const mentionCount = ReadStateStore.getMentionCount ? ReadStateStore.getMentionCount(channel.id) : 0;

                            if (hasUnread || mentionCount > 0) {
                                const lastMessageId = ReadStateStore.lastMessageId ? ReadStateStore.lastMessageId(channel.id) : null;

                                channelsToAck.push({
                                    channelId: channel.id,
                                    messageId: lastMessageId,
                                    readStateType: 0
                                });

                                if (settings.store.debugMode) {
                                    logger.info("Found unread in unmuted guild channel :", {
                                        channelName: channel.name,
                                        channelId: channel.id,
                                        mentionCount: mentionCount,
                                        hasUnread: hasUnread,
                                        lastMessageId: lastMessageId
                                    });
                                }
                            }
                        }
                    });

                } catch (guildError) {
                    logger.error(`Error processing guild ${guildId}:`, guildError);
                }
            });

            if (settings.store.debugMode) {
                logger.info(`Processed ${serversProcessed} servers, checked ${totalChannelsChecked} channels, found ${channelsToAck.length} channels to acknowledge`);
            }

            if (channelsToAck.length > 0) {
                try {
                    FluxDispatcher.dispatch({
                        type: "BULK_ACK",
                        context: "APP",
                        channels: channelsToAck
                    });

                    logger.info(`Successfully dispatched BULK_ACK for ${channelsToAck.length} channels from hidden servers/folders`);
                } catch (bulkError) {
                    if (settings.store.debugMode) {
                        logger.warn("BULK_ACK failed, falling back to individual MESSAGE_ACK events:", bulkError);
                    }

                    let successCount = 0;
                    channelsToAck.forEach(({ channelId, messageId }) => {
                        try {
                            if (messageId) {
                                FluxDispatcher.dispatch({
                                    type: "MESSAGE_ACK",
                                    channelId: channelId,
                                    messageId: messageId,
                                    version: Date.now()
                                });
                                successCount++;
                            }
                        } catch (ackError) {
                            if (settings.store.debugMode) {
                                logger.error(`Individual ACK (also) failed for channel ${channelId}:`, ackError);
                            }
                        }
                    });

                    if (successCount > 0) {
                        logger.info(`Successfully dispatched ${successCount} individual MESSAGE_ACK events`);
                    }
                }
            } else {
                logger.info("There's nothing to clear from hidden servers/folders !");
            }

        } catch (error) {
            logger.error("Mentions clearing failed :", error);
        }
    } else {
        logger.warn(`Skipping mentions clearing - "onlyHideInStream" is ON but Streamer Mode is OFF !`);
    }
}

function isGuildMuted(guildId: string): boolean {
    try {
        const UserGuildSettingsStore = Vencord.Webpack.findStore("UserGuildSettingsStore") || Vencord.Webpack.findByProps("getGuildSettings", "isMuted") || Vencord.Webpack.findByProps("getUserGuildSettings");

        if (UserGuildSettingsStore) {
            if (UserGuildSettingsStore.isMuted && typeof UserGuildSettingsStore.isMuted === 'function') {
                return UserGuildSettingsStore.isMuted(guildId);
            }
        }

        const GuildSettingsStore = Vencord.Webpack.findByProps("getMessageNotifications", "getGuildSettings");
        if (GuildSettingsStore && GuildSettingsStore.getGuildSettings) {
            const settings = GuildSettingsStore.getGuildSettings(guildId);
            return settings?.muted === true;
        }

        return false;
    } catch (error) {
        if (settings.store.debugMode) {
            logger.warn(`Could not determine mute status for guild ${guildId}:`, error);
        }
        return false;
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
        if (settings.store.debugMode) {
            logger.info(`Hid server ${serverId}`);
        }
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
        if (settings.store.debugMode) {
            logger.info(`Hid folder ${folderId}`);
        }
    }

    saveHiddenData();
    updateCSSClasses();
}

// =============
// MAIN PLUGIN =
// =============
export default definePlugin({
    name: "CleanCord",
    description: "Allows you to hide certain servers/folders in your server list with right-click option and suppress their mentions",
    authors: [{ name: "Tetra_Sky", id: 406453997294190594n }],
    settings,

    streamerModeStore: null as any,
    streamerModeListener: null as (() => void) | null,

    start() {
        loadHiddenData();
        this.streamerModeStore = Vencord.Webpack.findStore("StreamerModeStore") || Vencord.Webpack.getByProps("StreamerModeStore")?.StreamerModeStore;
        this.updateStreamerModeListener();
        updateCSSClasses();

        if (settings.store.suppressionMode !== "off") {
            this.patchFluxDispatcher();
            if (settings.store.autoClearMentions) {
                this.clearHiddenMentions();
            }
        } else {
            this.unpatchFluxDispatcher();
        }
    },

    stop() {
        this.removeStreamerModeListener();
        this.unpatchFluxDispatcher();

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

    patchFluxDispatcher() {
        patchFluxDispatcher();
    },

    unpatchFluxDispatcher() {
        unpatchFluxDispatcher();
    },

    clearHiddenMentions() {
        clearHiddenMentions();
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
                    id="clean-cord-menu"
                    label="CleanCord"
                >
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
                    <Menu.MenuItem
                        id="clean-cord-manage"
                        label="Manage Hidden Servers & Folders"
                        action={() => {
                            Vencord.Webpack.Common.SettingsRouter.open("VencordPlugins"); // Opens the Vencord settings panel, need to find a way to redirect to CleanCord's settings (Not implemented yet)
                        }}
                    />
                </Menu.MenuItem>
            );
        }
    }
});
