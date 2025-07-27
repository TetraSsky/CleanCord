/**
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors*
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Component for UI React displaying and managing hidden servers/folders
 * Used by both the Hidden Servers and Hidden Folders settings panels
 *
 * Cleaner implementation instead of being written within index.tsx :) !
 * We now consider Servers & Folders as "items", depending on the type prop we dynamically render the correct UI
*/

import { React } from "@webpack/common";

interface HiddenItemsListProps {
    type: "server" | "folder";
    items: string[];
    onToggle: (id: string) => void;
    onClearAll: () => void;
    onlyHideInStreamEnabled: boolean;
}

export function HiddenItemsList({ type, items, onToggle, onClearAll, onlyHideInStreamEnabled }: HiddenItemsListProps) {
    const isStreamMode = Vencord.Plugins.plugins.CleanCord?.isStreamingMode() ?? false;

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

    return React.createElement("div", { style: containerStyle }, [
        React.createElement("div", { key: "header", style: headerStyle }, [
            React.createElement("h3", {
                key: "title",
                style: { margin: 0, color: "var(--header-primary)" }
            }, `Hidden ${type === "server" ? "Servers" : "Folders"}`),
            React.createElement("button", {
                key: "clear-button",
                onClick: onClearAll,
                style: buttonStyle
            }, "Unhide All")
        ]),

        onlyHideInStreamEnabled && React.createElement("div", {
            key: "stream-status",
            style: statusStyle
        }, isStreamMode
            ? `🔴 Streamer Mode ON - ${type === "server" ? "Servers" : "Folders"} are hidden`
            : `⚠️ Streamer Mode OFF - ${type === "server" ? "Servers" : "Folders"} are visible despite being in list`
        ),

        React.createElement("div", {
            key: "item-list",
            style: { maxHeight: "300px", overflowY: "auto" }
        }, items.length === 0
            ? React.createElement("div", {
                style: {
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "20px"
                }
            }, `No hidden ${type === "server" ? "servers" : "folders"}. Right-click to hide.`)
            : items.map(id =>
                React.createElement("div", {
                    key: id,
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
                        key: "id",
                        style: { color: "var(--text-danger)" }
                    }, `${type === "server" ? "Server" : "Folder"} ID: ${id}`),
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
                            style: { color: "var(--text-muted)" }
                        }, "Hidden"),
                        React.createElement("input", {
                            key: "toggle-input",
                            type: "checkbox",
                            checked: true,
                            onChange: () => onToggle(id),
                            style: { cursor: "pointer" }
                        })
                    ])
                ])
            )
        )
    ]);
}
