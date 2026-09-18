'use client'

import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import { Coffee, RotateCcw } from 'lucide-react'
import type { DrinkType } from '@/types'
import { DRINK_CONFIG } from '@/types'

function CoffeeCup({ drinkType }: { drinkType: DrinkType }) {
  const cupRef = useRef<THREE.Group>(null)
  const drink = DRINK_CONFIG[drinkType] || DRINK_CONFIG.coffee

  useFrame((state, delta) => {
    if (cupRef.current) {
      cupRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={cupRef}>
      {/* Cup body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 0.8, 2, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Drink inside */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.9, 0.7, 1.8, 32]} />
        <meshStandardMaterial color={drink.color} />
      </mesh>
      {/* Handle */}
      <mesh position={[1.2, 0, 0]}>
        <torusGeometry args={[0.4, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Saucer */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.1, 32]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  )
}

export function Coffee3DPreview({ drinkType, onBack }: { drinkType: DrinkType; onBack?: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="relative w-full">
      <div className="aspect-[4/3] w-full max-w-2xl mx-auto bg-stone-100 rounded-2xl overflow-hidden">
        <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />
          <CoffeeCup drinkType={drinkType} />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Coffee className="w-6 h-6 text-sky-600" />
          <h3 className="font-serif text-xl text-stone-800">{DRINK_CONFIG[drinkType].name}</h3>
        </div>
        <p className="text-stone-500 text-sm mb-4">{DRINK_CONFIG[drinkType].description}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Back to Menu
          </button>
        )}
      </motion.div>
    </div>
  )
}
