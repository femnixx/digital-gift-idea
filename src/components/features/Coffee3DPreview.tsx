'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { motion } from 'framer-motion'
import { Coffee, RotateCcw } from 'lucide-react'
import type { DrinkType } from '@/types'
import { DRINK_CONFIG } from '@/types'

/**
 * 3D coffee cup preview, built directly on three.js.
 *
 * This deliberately does not use @react-three/fiber or @react-three/drei. Those
 * packages only ship React 19 builds, and this project runs React 18, so
 * importing them crashed the create route for every gift type. `three` itself
 * has no React dependency, so driving it from an effect keeps real 3D without
 * coupling the renderer to the React version.
 *
 * drei's Environment preset is replaced by three's own RoomEnvironment, and its
 * useFrame rotation by a requestAnimationFrame loop, so nothing is lost.
 */
export function Coffee3DPreview({ drinkType, onBack }: { drinkType: DrinkType; onBack?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      // No WebGL (older device, blocklisted GPU). The text below still renders.
      setFailed(true)
      return
    }

    const drink = DRINK_CONFIG[drinkType] || DRINK_CONFIG.coffee

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 480)
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      50,
      (mount.clientWidth || 640) / (mount.clientHeight || 480),
      0.1,
      100
    )
    camera.position.set(3, 2, 3)

    // Lighting: a hemisphere fill plus a key and a rim light.
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(5, 5, 5)
    scene.add(key)
    const rim = new THREE.PointLight(0xffffff, 0.6)
    rim.position.set(-5, 5, -5)
    scene.add(rim)

    // Reflections for the ceramic, replacing drei's <Environment preset="city"/>.
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    // Everything created here is tracked so cleanup can dispose it.
    const disposables: Array<{ dispose: () => void }> = []

    function track<T extends { dispose: () => void }>(resource: T): T {
      disposables.push(resource)
      return resource
    }

    const cup = new THREE.Group()
    scene.add(cup)

    const bodyGeometry = track(new THREE.CylinderGeometry(1, 0.8, 2, 32))
    const bodyMaterial = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 }))
    cup.add(new THREE.Mesh(bodyGeometry, bodyMaterial))

    const drinkGeometry = track(new THREE.CylinderGeometry(0.9, 0.7, 1.8, 32))
    const drinkMaterial = track(new THREE.MeshStandardMaterial({ color: new THREE.Color(drink.color), roughness: 0.35 }))
    const drinkMesh = new THREE.Mesh(drinkGeometry, drinkMaterial)
    drinkMesh.position.y = 0.1
    cup.add(drinkMesh)

    const handleGeometry = track(new THREE.TorusGeometry(0.4, 0.1, 16, 32, Math.PI))
    const handleMaterial = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 }))
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(1.2, 0, 0)
    cup.add(handle)

    const saucerGeometry = track(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 32))
    const saucerMaterial = track(new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 }))
    const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial)
    saucer.position.y = -1.1
    cup.add(saucer)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 2
    controls.target.set(0, 0, 0)

    function onResize() {
      if (!mount) return
      const width = mount.clientWidth
      const height = mount.clientHeight
      if (width === 0 || height === 0) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    const observer = new ResizeObserver(onResize)
    observer.observe(mount)

    const clock = new THREE.Clock()
    let frame = 0

    function animate() {
      frame = requestAnimationFrame(animate)
      // Replaces drei's useFrame rotation.
      cup.rotation.y += clock.getDelta() * 0.3
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      for (const resource of disposables) resource.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [drinkType])

  return (
    <div className="relative w-full">
      <div className="aspect-[4/3] w-full max-w-2xl mx-auto bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden">
        {failed ? (
          <div className="w-full h-full flex items-center justify-center text-sm muted-foreground">
            3D preview is unavailable on this device
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full" aria-label="3D preview of your drink" />
        )}
      </div>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Coffee className="w-6 h-6 text-sky-600" />
          <h3 className="font-serif text-xl text-stone-800 dark:text-stone-200">{DRINK_CONFIG[drinkType].name}</h3>
        </div>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">{DRINK_CONFIG[drinkType].description}</p>
        {onBack && (
          <button onClick={onBack} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Back to Menu
          </button>
        )}
      </motion.div>
    </div>
  )
}
