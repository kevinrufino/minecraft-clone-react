import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { FPV } from './components/FPV';
import { TextureSelector } from './components/TextureSelector';
import { Menu } from './components/Menu'
import { Help } from './components/Help';
import { Scene } from './components/Scene';

function App() {
  return (
    <>
      <Canvas>
        <Sky sunPosition={[100, 100, 20]}/>
        <ambientLight intensity={.5} />
        <FPV />
        <Physics>
          <Scene />
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
