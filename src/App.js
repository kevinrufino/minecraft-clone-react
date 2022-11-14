import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Cubes } from './components/Cubes';
import { FPV } from './components/FPV';
import { Ground } from './components/Ground';
import { Player } from './components/Player';
import { TextureSelector } from './components/TextureSelector';
import { Menu } from './components/Menu'
import { Help } from './components/Help';

function App() {
  return (
    <>
      <Canvas>
        <Sky sunPosition={[100, 100, 20]}/>
        <ambientLight intensity={.5} />
        <FPV />
        <Physics>
          <Player />
          <Cubes />
          <Ground />
        </Physics>
      </Canvas>
      <div className='cursor centered absolute'>+</div>
      <TextureSelector />
      <Menu />
      <Help />
    </>
  );
}

export default App;
