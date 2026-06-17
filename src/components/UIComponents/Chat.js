import { useEffect, useRef, useState } from "react";
import { useStore } from "../../hooks/useStore";

// In-game text chat (#50). Press T or Enter while playing to open the input,
// type a message, Enter to send (Esc to cancel). Recent messages fade in the
// bottom-left while closed and stay pinned while open -- classic Minecraft.
//
// Sending goes through the store (online_sendChat): it echoes locally right
// away and, when online, emits socket "C_chat"; the socket listener feeds
// incoming "S_chat" back in. Works single-player too -- you just see your own
// lines (and the keys still respond, which is what you'd expect).

const VISIBLE_MS = 9000; // how long a message lingers after arriving (when closed)
const MAX_LEN = 120;

function requestLock() {
  const canvas = document.querySelector("canvas");
  if (canvas) canvas.requestPointerLock();
}

export function Chat() {
  const chat = useStore((s) => s.chat);
  const chatOpen = useStore((s) => s.chatOpen);
  const sendChat = useStore((s) => s.online_sendChat);
  const [draft, setDraft] = useState("");
  // re-render periodically so closed messages fade out on time
  const [, force] = useState(0);
  const inputRef = useRef(null);

  // close the input and re-lock the pointer so play resumes. (After Esc the
  // browser briefly blocks re-locking; if that happens PauseOverlay shows,
  // since it reacts to chatOpen -- a click resumes from there.)
  function close() {
    useStore.getState().setChatOpen(false);
    setDraft("");
    requestLock();
  }

  // Open on T / Enter, but only while actually playing (pointer locked).
  // Opening releases the pointer lock so the field can take input -- this frees
  // the cursor and stops the camera from following the mouse while you type.
  useEffect(() => {
    function onKeyDown(e) {
      const st = useStore.getState();
      if (st.chatOpen) return;
      if (e.code === "KeyT" || e.code === "Enter") {
        if (!document.pointerLockElement) {
          return; // not in-game (paused / menu / title)
        }
        e.preventDefault(); // don't leak the "t" into the field
        st.setChatOpen(true);
        document.exitPointerLock();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // focus the field when it opens
  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatOpen]);

  // tick a re-render while closed messages are still visible so they fade out
  useEffect(() => {
    if (chatOpen || chat.length === 0) {
      return;
    }
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [chatOpen, chat.length]);

  function onInputKeyDown(e) {
    // keep the movement / hotbar handlers from also seeing the keystroke
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

  const now = Date.now();
  const shown = (chatOpen
    ? chat
    : chat.filter((m) => now - m.t < VISIBLE_MS)
  ).slice(-12);
  if (!chatOpen && shown.length === 0) {
    return null;
  }

  return (
    <div className={`chat${chatOpen ? " chat--open" : ""}`}>
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
      {chatOpen && (
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
