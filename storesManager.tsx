/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors
* SPDX-License-Identifier: GPL-3.0-or-later
*
* Centralized Discord store management file
* Handles lazy initialization and helper methods
*
* Way easier to deploy a fix when something changes with stores on Discord's end
*/

import { Logger } from "@utils/Logger";

const logger = new Logger("CleanCord:StoresManager");

export class DiscordStores {
    private static _instance: DiscordStores | null = null;
    private _initialized = false;

    public SortedGuildStore: any = null;
    public GuildStore: any = null;
    public ChannelStore: any = null;
    public GuildChannelStore: any = null;
    public ReadStateStore: any = null;
    public UserStore: any = null;
    public SelectedGuildStore: any = null;
    public UserGuildSettingsStore: any = null;
    public StreamerModeStore: any = null;
    public QuickSwitcherUtils: any = null;

    private constructor() {
        // Stores are initialized lazily when first accessed
    }

    /**
     * Initialize all Discord stores using Vencord's Webpack utilities
     */
    private initializeStores(): void {
        if (this._initialized || typeof Vencord === 'undefined') return;

        try {
            logger.info("Initializing Discord stores...");

            // Initialize all required stores
            this.SortedGuildStore = Vencord.Webpack.findStore("SortedGuildStore");
            this.GuildStore = Vencord.Webpack.findStore("GuildStore") || Vencord.Webpack.findByProps("getGuild", "getGuilds");
            this.ChannelStore = Vencord.Webpack.findStore("ChannelStore") || Vencord.Webpack.findByProps("getChannel", "getChannels");
            this.GuildChannelStore = Vencord.Webpack.findStore("GuildChannelStore") || Vencord.Webpack.findByProps("getChannels", "getSelectableChannels");
            this.ReadStateStore = Vencord.Webpack.findStore("ReadStateStore") || Vencord.Webpack.findByProps("hasUnread", "getMentionCount");
            this.UserStore = Vencord.Webpack.findStore("UserStore");
            this.SelectedGuildStore = Vencord.Webpack.findStore("SelectedGuildStore");
            this.UserGuildSettingsStore = Vencord.Webpack.findStore("UserGuildSettingsStore") || Vencord.Webpack.findByProps("getGuildSettings", "isMuted") || Vencord.Webpack.findByProps("getUserGuildSettings");
            this.StreamerModeStore = Vencord.Webpack.findStore("StreamerModeStore") ||  Vencord.Webpack.getByProps("StreamerModeStore")?.StreamerModeStore;
            this.QuickSwitcherUtils = Vencord.Webpack.findByProps("queryGuilds", "queryChannels");

            this._initialized = true;
            logger.info("Discord stores initialized successfully");

            // REMINDER : 5 names per line
            const storeNames = [
                'SortedGuildStore', 'GuildStore', 'ChannelStore', 'GuildChannelStore', 'ReadStateStore',
                'UserStore', 'SelectedGuildStore', 'UserGuildSettingsStore', 'StreamerModeStore', 'QuickSwitcherUtils',
            ];

            const failedStores = storeNames.filter(name => !this[name]);
            if (failedStores.length > 0) {
                logger.warn("Failed to initialize stores:", failedStores);
            }

        } catch (error) {
            logger.error("Failed to initialize Discord stores:", error);
        }
    }

    /**
     * Get the singleton instance of DiscordStores
     * Automatically initializes stores on first access
     */
    public static getInstance(): DiscordStores {
        if (!DiscordStores._instance) {
            DiscordStores._instance = new DiscordStores();
        }
        DiscordStores._instance.initializeStores();
        return DiscordStores._instance;
    }

    /**
     * Force re-initialization of stores (For Discord updates)
     */
    public reinitialize(): void {
        this._initialized = false;
        this.initializeStores();
    }

    /**
     * Check if stores have been successfully initialized
     */
    public get isInitialized(): boolean {
        return this._initialized;
    }

    // ===============================
    // CONVENIENCE HELPER METHODS    =
    // ===============================

    /**
     * Get the current user's ID
     */
    public getCurrentUserId(): string | null {
        this.initializeStores();
        return this.UserStore?.getCurrentUser()?.id || null;
    }

    /**
     * Get the currently selected guild ID
     */
    public getCurrentGuildId(): string | null {
        this.initializeStores();
        return this.SelectedGuildStore?.getGuildId() || null;
    }

    /**
     * Get all guild folders
     */
    public getGuildFolders(): any[] {
        this.initializeStores();
        return this.SortedGuildStore?.getGuildFolders?.() || [];
    }

    /**
     * Check if a guild is muted
     */
    public isGuildMuted(guildId: string): boolean {
        this.initializeStores();

        if (!guildId) return false;

        try {
            // Try UserGuildSettingsStore first
            if (this.UserGuildSettingsStore?.isMuted &&
                typeof this.UserGuildSettingsStore.isMuted === 'function') {
                return this.UserGuildSettingsStore.isMuted(guildId);
            }

            return false;
        } catch (error) {
            logger.warn(`Could not determine mute status for guild ${guildId}:`, error);
            return false;
        }
    }

    /**
     * Get all channels for a specific guild
     */
    public getGuildChannels(guildId: string): any[] {
        this.initializeStores();

        if (!guildId || !this.GuildChannelStore?.getChannels) return [];

        try {
            const guildChannels = this.GuildChannelStore.getChannels(guildId);
            if (guildChannels?.SELECTABLE) {
                return guildChannels.SELECTABLE
                    .map((item: any) => item.channel)
                    .filter(Boolean);
            }
        } catch (error) {
            logger.warn(`Could not get channels for guild ${guildId}:`, error);
        }

        return [];
    }

    /**
     * Check if Discord is currently in streaming mode
     */
    public isStreamingMode(): boolean {
        this.initializeStores();

        try {
            return this.StreamerModeStore?.enabled || false;
        } catch (error) {
            logger.error("Error checking streamer mode:", error);
            return false;
        }
    }

    /**
     * Get a guild by ID
     */
    public getGuild(guildId: string): any {
        this.initializeStores();
        return this.GuildStore?.getGuild?.(guildId) || null;
    }

    /**
     * Get mention count for a channel
     */
    public getMentionCount(channelId: string): number {
        this.initializeStores();
        return this.ReadStateStore?.getMentionCount?.(channelId) || 0;
    }

    /**
     * Check if a channel has unread messages
     */
    public hasUnread(channelId: string): boolean {
        this.initializeStores();
        return this.ReadStateStore?.hasUnread?.(channelId) || false;
    }

    /**
     * Get the last message ID for a channel
     */
    public getLastMessageId(channelId: string): string | null {
        this.initializeStores();
        return this.ReadStateStore?.lastMessageId?.(channelId) || null;
    }

    /**
     * Get servers that are inside hidden folders
     */
    public getServersFromFolders(folderIds: string[]): string[] {
        const serversInFolders: string[] = [];

        try {
            const guildFolders = this.getGuildFolders();

            folderIds.forEach(folderId => {
                const folder = guildFolders.find((folder: any) =>
                    folder.folderId === folderId || folder.id === folderId
                );

                if (folder?.guildIds) {
                    folder.guildIds.forEach((guildId: string) => {
                        if (guildId && !serversInFolders.includes(guildId)) {
                            serversInFolders.push(guildId);
                        }
                    });
                }
            });
        } catch (error) {
            logger.error("Error getting servers from folders:", error);
        }

        return serversInFolders;
    }

    /**
     * Get Quick Switcher utilities for patching
     */
    public getQuickSwitcherUtils(): any {
        this.initializeStores();
        return this.QuickSwitcherUtils;
    }

    // ===============================
    // STORE ACCESS VALIDATION       =
    // ===============================

    /**
     * Validate that all required stores are available
     * Returns array of missing store names
     */
    public validateStores(): string[] {
        this.initializeStores();

        const requiredStores = {
            SortedGuildStore: this.SortedGuildStore,
            GuildStore: this.GuildStore,
            ReadStateStore: this.ReadStateStore,
            UserStore: this.UserStore,
            SelectedGuildStore: this.SelectedGuildStore
        };

        return Object.entries(requiredStores)
            .filter(([name, store]) => !store)
            .map(([name]) => name);
    }

    /**
     * Get diagnostic information about store initialization
     */
    public getDiagnostics() {
        return {
            initialized: this._initialized,
            vencordAvailable: typeof Vencord !== 'undefined',
            missingStores: this.validateStores(),
            currentUserId: this.getCurrentUserId(),
            currentGuildId: this.getCurrentGuildId(),
            isStreaming: this.isStreamingMode(),
            quickSwitcherAvailable: this.getQuickSwitcherUtils()
        };
    }
}
