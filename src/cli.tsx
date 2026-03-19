import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useState, useEffect, useCallback } from "react"
import { 
  getSessions, 
  getWindows, 
  killSession, 
  killWindow, 
  type TmuxSession, 
  type TmuxWindow 
} from "./index"
import { useKeyboard, useRenderer } from "@opentui/react"

type FocusPanel = "sessions" | "windows"

function App() {
  const renderer = useRenderer()
  const [sessions, setSessions] = useState<TmuxSession[]>([])
  const [windows, setWindows] = useState<TmuxWindow[]>([])
  const [selectedSession, setSelectedSession] = useState(0)
  const [selectedWindow, setSelectedWindow] = useState(0)
  const [focusPanel, setFocusPanel] = useState<FocusPanel>("sessions")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "session" | "window"; name: string; id?: string } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const sessionList = await getSessions()
      setSessions(sessionList)
      
      if (sessionList.length > 0 && sessionList[selectedSession]) {
        const windowList = await getWindows(sessionList[selectedSession].name)
        setWindows(windowList)
      } else {
        setWindows([])
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tmux data")
    } finally {
      setLoading(false)
    }
  }, [selectedSession])

  useEffect(() => {
    loadData()
  }, [loadData])

  useKeyboard((key) => {
    if (deleteConfirm) {
      if (key.name === "y" || key.name === "enter" || key.name === "return") {
        handleConfirmDelete()
      } else if (key.name === "n" || key.name === "escape") {
        setDeleteConfirm(null)
      }
      return
    }

    if (key.name === "escape") {
      renderer.destroy()
      return
    }
    
    if (key.name === "tab") {
      setFocusPanel(p => p === "sessions" ? "windows" : "sessions")
      return
    }
    
    if (key.name === "r" && !key.ctrl) {
      setLoading(true)
      loadData()
      return
    }

    if (key.name === "d" || key.name === "delete") {
      handleDeleteRequest()
      return
    }

    if (focusPanel === "sessions") {
      handleSessionNavigation(key)
    } else {
      handleWindowNavigation(key)
    }
  })

  const handleSessionNavigation = (key: { name: string; ctrl?: boolean }) => {
    if ((key.name === "j" || key.name === "down") && selectedSession < sessions.length - 1) {
      setSelectedSession(s => s + 1)
      setSelectedWindow(0)
    } else if ((key.name === "k" || key.name === "up") && selectedSession > 0) {
      setSelectedSession(s => s - 1)
      setSelectedWindow(0)
    }
  }

  const handleWindowNavigation = (key: { name: string }) => {
    if ((key.name === "j" || key.name === "down") && selectedWindow < windows.length - 1) {
      setSelectedWindow(w => w + 1)
    } else if ((key.name === "k" || key.name === "up") && selectedWindow > 0) {
      setSelectedWindow(w => w - 1)
    }
  }

  const handleDeleteRequest = () => {
    if (focusPanel === "sessions" && sessions[selectedSession]) {
      setDeleteConfirm({ type: "session", name: sessions[selectedSession].name })
    } else if (focusPanel === "windows" && windows[selectedWindow]) {
      setDeleteConfirm({ 
        type: "window", 
        name: windows[selectedWindow].name, 
        id: windows[selectedWindow].id 
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    
    setLoading(true)
    try {
      if (deleteConfirm.type === "session") {
        const success = await killSession(deleteConfirm.name)
        if (success) {
          const newSessions = sessions.filter(s => s.name !== deleteConfirm.name)
          setSessions(newSessions)
          if (selectedSession >= newSessions.length) {
            setSelectedSession(Math.max(0, newSessions.length - 1))
          }
        }
      } else if (deleteConfirm.id) {
        const success = await killWindow(deleteConfirm.id)
        if (success) {
          const newWindows = windows.filter(w => w.id !== deleteConfirm!.id)
          setWindows(newWindows)
          if (selectedWindow >= newWindows.length) {
            setSelectedWindow(Math.max(0, newWindows.length - 1))
          }
          const sessionIndex = sessions.findIndex(s => s.name === windows[0]?.session)
          if (sessionIndex >= 0) {
            const existingSession = sessions[sessionIndex]
            if (existingSession) {
              const updatedSessions = [...sessions]
              updatedSessions[sessionIndex] = { 
                name: existingSession.name,
                windows: newWindows.length, 
                attached: existingSession.attached,
                created: existingSession.created
              }
              setSessions(updatedSessions)
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeleteConfirm(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessions[selectedSession]) {
      getWindows(sessions[selectedSession].name).then(setWindows)
    }
  }, [selectedSession, sessions])

  if (loading) {
    return (
      <box flexGrow={1} alignItems="center" justifyContent="center">
        <text>Loading tmux sessions...</text>
      </box>
    )
  }

  if (sessions.length === 0) {
    return (
      <box flexGrow={1} alignItems="center" justifyContent="center" flexDirection="column" gap={1}>
        <text fg="#ff6b6b">No tmux sessions found</text>
        <text fg="#888">Start a session with: tmux new -s name</text>
        <text fg="#888">Press ESC to exit</text>
      </box>
    )
  }

  return (
    <box flexGrow={1} flexDirection="column">
      <box height={1} backgroundColor="#1e1e2e" paddingX={1}>
        <text>Tmux Manager    ESC: Exit | Tab: Switch Panel | d: Delete | r: Refresh</text>
      </box>
      
      {error && (
        <box backgroundColor="#ff6b6b" padding={1}>
          <text>Error: {error}</text>
        </box>
      )}
      
      <box flexDirection="row" flexGrow={1}>
        <box flexDirection="column" width="50%" border backgroundColor="#1a1b26">
          <box border paddingX={1} backgroundColor="#24283b">
            <text>Sessions ({sessions.length}){focusPanel === "sessions" ? <span fg="#7aa2f7"> [ACTIVE]</span> : null}</text>
          </box>
          <scrollbox focused={focusPanel === "sessions"} flexGrow={1}>
            <box flexDirection="column">
              {sessions.map((session, i) => (
                <SessionItem 
                  key={session.name} 
                  session={session} 
                  selected={i === selectedSession && focusPanel === "sessions"}
                />
              ))}
            </box>
          </scrollbox>
        </box>
        
        <box flexDirection="column" flexGrow={1} border backgroundColor="#1a1b26">
          <box border paddingX={1} backgroundColor="#24283b">
            <text>Windows ({windows.length}){focusPanel === "windows" ? <span fg="#7aa2f7"> [ACTIVE]</span> : null}</text>
          </box>
          <scrollbox focused={focusPanel === "windows"} flexGrow={1}>
            <box flexDirection="column">
              {windows.length === 0 ? (
                <box padding={1}>
                  <text fg="#888">No windows in this session</text>
                </box>
              ) : (
                windows.map((win, i) => (
                  <WindowItem 
                    key={win.id} 
                    win={win}
                    selected={i === selectedWindow && focusPanel === "windows"}
                  />
                ))
              )}
            </box>
          </scrollbox>
        </box>
      </box>

      {deleteConfirm && (
        <box 
          position="absolute" 
          top="50%" 
          left="50%" 
          width={50} 
          backgroundColor="#3b224c" 
          border
          borderColor="#ff6b6b"
          padding={1}
        >
          <box flexDirection="column" gap={1}>
            <text fg="#ff6b6b">Confirm Delete</text>
            <text>Delete {deleteConfirm.type}: {deleteConfirm.name}?</text>
            <text fg="#888">y/Enter: Yes | n/Esc: No</text>
          </box>
        </box>
      )}
    </box>
  )
}

function SessionItem({ session, selected }: { session: TmuxSession; selected: boolean }) {
  const bgColor = selected ? "#3d59a1" : (session.attached ? "#2a3a4a" : "transparent")
  const fgColor = selected ? "#fff" : "#c0caf5"
  const arrowFg = selected ? "#fff" : (session.attached ? "#7dcfff" : "#c0caf5")
  
  return (
    <box paddingX={1} backgroundColor={bgColor}>
      <text>
        <span fg={arrowFg}>{selected ? "> " : "  "}</span>
        {selected ? <span fg="#fff">{session.name}</span> : <span fg="#c0caf5">{session.name}</span>}
        <span fg="#565f89"> (</span>
        <span fg="#9ece6a">{session.windows}</span>
        <span fg="#565f89"> windows)</span>
        {session.attached && <span fg="#e0af68"> [attached]</span>}
        <span fg="#565f89"> {session.created}</span>
      </text>
    </box>
  )
}

function WindowItem({ win, selected }: { win: TmuxWindow; selected: boolean }) {
  const bgColor = selected ? "#3d59a1" : (win.active ? "#3a4a2a" : "transparent")
  
  return (
    <box paddingX={1} backgroundColor={bgColor}>
      <text>
        <span fg={selected ? "#fff" : "#c0caf5"}>{selected ? "> " : "  "}</span>
        {selected ? <span fg="#fff">{win.name}</span> : <span fg="#c0caf5">{win.name}</span>}
        <span fg="#565f89"> [</span>
        <span fg="#ff9e64">{win.id}</span>
        <span fg="#565f89">]</span>
        <span fg="#565f89"> (</span>
        <span fg="#9ece6a">{win.panes}</span>
        <span fg="#565f89"> panes)</span>
        {win.active && <span fg="#bb9af7"> [active]</span>}
      </text>
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
