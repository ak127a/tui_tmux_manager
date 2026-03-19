import { $ } from "bun"

export interface TmuxSession {
  name: string
  windows: number
  attached: boolean
  created: string
}

export interface TmuxWindow {
  id: string
  name: string
  session: string
  panes: number
  active: boolean
}

async function runCmd(cmd: string[]): Promise<string> {
  try {
    const proc = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" })
    return proc.stdout.toString()
  } catch {
    return ""
  }
}

export async function getSessions(): Promise<TmuxSession[]> {
  const output = await runCmd(["tmux", "list-sessions", "-F", "#{session_name}|#{session_windows}|#{session_attached}|#{session_created}"])
  if (!output) return []
  
  return output.trim().split("\n").filter(Boolean).map((line) => {
    const parts = line.split("|")
    const [name, windows, attached, created] = parts
    return {
      name: name ?? "",
      windows: parseInt(windows ?? "0") || 0,
      attached: attached === "1",
      created: formatTimestamp(parseInt(created ?? "0"))
    }
  })
}

export async function getWindows(sessionName: string): Promise<TmuxWindow[]> {
  const output = await runCmd(["tmux", "list-windows", "-t", sessionName, "-F", "#{window_id}|#{window_name}|#{session_name}|#{window_panes}|#{window_active}"])
  if (!output) return []
  
  return output.trim().split("\n").filter(Boolean).map((line) => {
    const parts = line.split("|")
    const [id, name, session, panes, active] = parts
    return {
      id: id ?? "",
      name: name ?? "",
      session: session ?? "",
      panes: parseInt(panes ?? "0") || 0,
      active: active === "1"
    }
  })
}

export async function killSession(sessionName: string): Promise<boolean> {
  try {
    const proc = Bun.spawnSync(["tmux", "kill-session", "-t", sessionName], { stdout: "pipe", stderr: "pipe" })
    return proc.exitCode === 0
  } catch {
    return false
  }
}

export async function killWindow(windowId: string): Promise<boolean> {
  try {
    const proc = Bun.spawnSync(["tmux", "kill-window", "-t", windowId], { stdout: "pipe", stderr: "pipe" })
    return proc.exitCode === 0
  } catch {
    return false
  }
}

function formatTimestamp(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return ""
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
