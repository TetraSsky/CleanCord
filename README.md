# CleanCord - Server & Folder Hider for Vencord

![Banner](https://repository-images.githubusercontent.com/1027152240/1cae1602-f4be-470b-a213-6f54c31049b0)

CleanCord is a Vencord plugin that allows you to hide specific servers and folders from your Discord server list, helping you keep your interface clean and organized. Perfect for streamers or anyone who wants to temporarily hide certain servers.

## Features

- Hide individual servers with a right-click
- Hide entire folders with a right-click
- Option to only hide servers when in Streamer Mode
- Manage hidden servers/folders through a clean interface
- Preserves your hidden items between sessions
- Completely free and open-source

## Installation
**Prerequiries** : [git](https://git-scm.com/downloads) / [NodeJS](https://nodejs.org/en/download) / [pnpm](https://pnpm.io/installation)
- Open a CMD window, you will need a clone of Vencord's Repository, command : `git clone https://github.com/Vendicated/Vencord`
- Navigate to the path where you cloned the repository (Ex : "`cd C:\Documents\Vencord`") then type : `pnpm install --frozen-lockfile`
- Inside the 'Vencord' Folder, navigate to "`.\src\`" and create a new folder called "**userplugins**"
- Then inside that new 'userplugin' Folder, navigate to it with your (hopefully, still opened) CMD window (Ex : "`cd .\src\userplugins\`") and type, command : `git clone https://github.com/TetraSsky/CleanCord/`
- Then command : `pnpm build`
- And lastly command : `pnpm inject`  
(Select your Discord path (Stable / Canary))

## Usage

### Hiding Servers/Folders
1. Right-click on any server or folder in your server list
2. Select "Hide Server" or "Hide Folder" from the context menu
3. The server/folder will immediately disappear from your view

### Managing Hidden Items
1. Go to Vencord Settings > Plugins > CleanCord
2. You'll see two sections:
   - **Hidden Servers**: Lists all currently hidden servers
   - **Hidden Folders**: Lists all currently hidden folders
3. Toggle the checkboxes to show/hide items
4. Use "Unhide All" to reset everything

### Streamer Mode Integration
Enable the "Only hide in Streamer Mode" option to:
- Keep servers/folders visible normally
- Automatically hide them when Streamer Mode is active
- Automatically handle notifications & mentions when Streamer Mode is active

## Options

| Option | Description | Default |
|--------|-------------|---------|
| Show Options | Displays the hide/unhide options in right-click menus | Enabled |
| Only Hide in Streamer Mode | Servers/folders will only be hidden when Streamer Mode is active | Disabled |
| Suppression Mode | Default - Keep initial Discord behaviour for notifications / Silent - Block all notifications in real-time from hidden servers/folders (Resets on startup) | Silent |
Auto Clear Mentions | Automatically clear all unread badges from hidden servers/folders on startup (Recommended to use with 'Silent' mode) | Disabled |
| Hidden Servers | Manage your list of hidden servers | - |
| Hidden Folders | Manage your list of hidden folders | - |

## FAQ

**❓ : Will people know I've hidden servers/folders?**
- No, this is purely a visual change on your client. Others can't see what you've hidden. Moreover, there is an option to completely hide the right-click options in the settings!

**❓: Do hidden servers still show notifications?**
- No, hidden servers won't display unread messages, mention counts or play notifications sounds.  
(Only when **Suppresion Mode** is set to <ins>Silent</ins> & (Preferably) **Auto Clear Mentions** is <ins>enabled</ins>)

**❓: Can I still access hidden servers?**
- Yes, you can still access them through Quick Switcher (Ctrl+K), joining one of your friends' activity, etc... or by unhiding them in settings.

**❓: Does this plugin breaks interaction with hidden servers?**
- No, people from any hidden server can still interact with you and vise versa. The "icons" Discord displays in the server listing are only hidden with Custom CSS injection.

**❓: Will my hidden servers stay hidden after restarting Discord?**
- Yes, your preferences are saved between sessions!

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="https://github.com/user-attachments/assets/852ba7ea-c221-49e1-a30a-60e3f6024c92" alt="Context menu" style="width:100%"></td>
    <td width="50%"><img src="https://github.com/user-attachments/assets/95dba3e9-4018-43b9-9afa-509037c9653c" alt="Settings panel" style="width:100%"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://github.com/user-attachments/assets/a5f9083f-ae9f-4715-b151-e52f1d8a6441" alt="Streamer mode example" style="width:100%"></td>
    <td width="50%"><img src="https://github.com/user-attachments/assets/a6b29511-285c-4972-a574-5968f66fb7ef" alt="Streamer mode example 2" style="width:100%"></td>
  </tr>
</table>

## Support

If you encounter any issues or have feature requests (This will entirely depend of my free time. Be aware.):
[Open an issue](https://github.com/yourusername/CleanCord/issues)

## Credits

This plugin is built for and requires [Vencord](https://github.com/Vendicated/Vencord), a Discord client mod! Big thanks to them ❤️❤️❤️!

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=TetraSsky/CleanCord&type=Date)](https://www.star-history.com/#TetraSsky/CleanCord&Date)

## License
MIT License - See [LICENSE](LICENSE) for details.
