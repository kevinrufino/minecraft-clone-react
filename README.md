# CloneCraft

A Minecraft clone built with React, three.js (react-three-fiber), and web workers.

Terrain is generated from seeded simplex noise inside a worker pool, meshed per
chunk with hidden-face culling, and streamed in/out around the player by view
radius. Movement, gravity, and block collision are handled by a custom voxel
physics controller in `src/components/playerComponents/Player.js`.

### How to start the app

    npm install
    npm start

That's it — the chunk worker is bundled automatically by react-scripts.

### Controls

- `WASD` to move, `Space` to jump, double-tap a movement key to sprint
- Left click places a block, right click removes one
- `1-5` or mouse wheel to change the active texture (enable the texture
  selector in the debug panel)
- The Leva panel (top right) toggles FPS stats, sky, orbital controls, and UI

### Multiplayer

Online play is disabled by default (`onlineEnabled` in `src/constants.js`).
The server lives at
[GreyDaCaLa/ReactMineCraftCloneServer](https://github.com/GreyDaCaLa/ReactMineCraftCloneServer)
and is expected on `localhost:5000`, or set `useRemoteServer: true` to use the
deployed instance.

### Known potential bugs

- World-fill edge case: as chunks are filled in batches, the outer edge of a
  batch can show side faces because the neighboring chunks didn't exist yet
  when the batch was meshed.
