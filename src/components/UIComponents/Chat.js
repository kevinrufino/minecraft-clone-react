import { useEffect, useRef, useState } from "react";
import settings from "../../constants";
import { useStore } from "../../hooks/useStore";

// In-game text chat (#50). Press T or Enter while playing to open the input,
// type a message, Enter to send (Esc to cancel). Recent messages fade in the
// bottom-left while closed and stay pinned while open -- classic Minecraft.
//
// Sending goes through the store (online_sendChat -> socket "C_chat"), and the
// socket listener feeds incoming "S_chat" back in. Only shown in multiplayer.

const VISIBLE_MS = 9000; // how long a message lingers after arriving (when closed)
const MAX_LEN = 120;

export function Chat() {
  const chat = useStore((s) => s.chat);
  const sendChat = useStore((s) => s.online_sendChat);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  // re-render periodically so closed messages fade out on time
  const [, force] = useState(0);
  const inputRef = useRef(null);

  function close() {
    setOpen(false);
    setDraft("");
    settings.chatOpen = false;
  }

  // open chat on T / Enter, but only while actually playing (pointer locked)
  useEffect(() => {
    function onKeyDown(e) {
      if (open || !settings.onlineEnabled) {
        return;
      }
      if (e.code === "KeyT" || e.code === "Enter") {
        if (!document.pointerLockElement) {
          return; // not in-game (paused / menu)
        }
        e.preventDefault(); // don't leak the "t" into the field
        setOpen(true);
        settings.chatOpen = true;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // focus the field when it opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // if pointer lock is lost (Esc/pause) while chat is open, close it so the
  // input never sticks around over the pause menu
  useEffect(() => {
    function onLockChange() {
      if (!document.pointerLockElement) {
        close();
      }
    }
    document.addEventListener("pointerlockchange", onLockChange);
    return () =>
      document.removeEventListener("pointerlockchange", onLockChange);
  }, []);

  // tick a re-render while closed messages are still visible so they fade out
  useEffect(() => {
    if (open || chat.length === 0) {
      return;
    }
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [open, chat.length]);

  function onInputKeyDown(e) {
    // keep movement/hotbar handlers from seeing the keystroke
    e.stopPropagation();
    if (e.code === "Enter") {
      const text = draft.trim().slice(0, MAX_LEN);
      if (text) {
        sendChat(text);
      }
      close();
    } else if (e.code === "Escape") {
      close();
    }
  }

  if (!settings.onlineEnabled) {
    return null;
  }

  const now = Date.now();
  const shown = (open ? chat : chat.filter((m) => now - m.t < VISIBLE_MS)).slice(
    -12,
  );
  if (!open && shown.length === 0) {
    return null;
  }

  return (
    <div className={`chat${open ? " chat--open" : ""}`}>
      {shown.length > 0 && (
        <ul className="chat__log">
          {shown.map((m) => (
            <li key={m.id} className="chat__msg">
              <span className="chat__name">{m.name}</span>
              <span className="chat__sep">: </span>
              {m.text}
            </li>
          ))}
        </ul>
      )}
      {open && (
        <input
          ref={inputRef}
          className="chat__input"
          type="text"
          value={draft}
          maxLength={MAX_LEN}
          placeholder="Press Enter to send, Esc to cancel"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onInputKeyDown}
        />
      )}
    </div>
  );
}
