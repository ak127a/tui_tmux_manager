# tmux-manager

A TUI application to manage tmux sessions and windows, built with OpenTUI.

## Prerequisites

- [tmux](https://github.com/tmux/tmux) must be installed and available in your PATH
- [Bun](https://bun.sh/) >= 1.2.0

## Quick Start

```bash
bunx tui_tmux_manager
```

## Library Usage

Import the functions you need:

```typescript
import { getSessions, getWindows, killSession, killWindow } from "tui_tmux_manager"

// Get all tmux sessions
const sessions = await getSessions()
// Returns: [{ name: "session1", windows: 3, attached: true, created: "2h ago" }, ...]

// Get windows for a specific session
const windows = await getWindows("my-session")
// Returns: [{ id: "@1", name: "window1", session: "my-session", panes: 1, active: true }, ...]

// Kill a session
await killSession("my-session") // Returns: true if successful

// Kill a window
await killWindow("@1") // Returns: true if successful
```

## CLI Usage

Run directly without installing:

```bash
bunx tui_tmux_manager
```

## Installation (Optional)

If you want to install it:

```bash
# Global install
bun install -g tui_tmux_manager
tmux-manager

# Or local install
bun add -d tui_tmux_manager
bunx tui_tmux_manager
```

## Features

- View and navigate tmux sessions and windows
- Delete sessions and windows with confirmation
- Refresh data with `r` key
- Switch panels with `Tab` key
- Vim-style navigation (`j`/`k` or arrow keys)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Exit |
| `Tab` | Switch panel |
| `j`/`↓` | Move down |
| `k`/`↑` | Move up |
| `d` | Delete selected |
| `r` | Refresh |

## License

MIT
