# tmux-manager

A TUI application to manage tmux sessions and windows, built with OpenTUI.

## Installation

```bash
bun add tmux-manager
# or
npm install tmux-manager
```

## Library Usage

```typescript
import { getSessions, getWindows, killSession, killWindow } from "tmux-manager"

const sessions = await getSessions()
const windows = await getWindows("my-session")
await killSession("my-session")
await killWindow("@1")
```

## CLI Usage

```bash
bun install
bun run dev
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
