import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';

function Logo3DContent() {
  const textRef = useRef();
  
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });

  return (
    <>
      <OrbitControls enableZoom={false} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <Text
        ref={textRef}
        fontSize={3}
        color="#1976d2"
      >
        GG
      </Text>
    </>
  );
}

function Logo3D() {
  return (
    <Canvas>
      <Logo3DContent />
    </Canvas>
  );
}

export default Logo3D;