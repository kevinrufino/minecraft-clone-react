// Simple visible body used to render other online players.
export const Basicplayer = ({ mypos }) => {
  return (
    <mesh position={mypos}>
      <sphereGeometry attach="geometry" args={[1]} />
      <meshStandardMaterial attach="material" color="red" />
    </mesh>
  );
};
