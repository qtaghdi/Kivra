import { useEffect, useRef } from "react";
import * as THREE from "three";

type loginMemorySceneProps = {
  className?: string;
};

export const LoginMemoryScene = ({ className }: loginMemorySceneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.35, 7.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    container.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const nodeGeometry = new THREE.IcosahedronGeometry(0.055, 1);
    const primaryMaterial = new THREE.MeshStandardMaterial({
      color: 0xeef4ff,
      emissive: 0x223044,
      emissiveIntensity: 0.4,
      roughness: 0.45,
      metalness: 0.18
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x8ef2b1,
      emissive: 0x235a36,
      emissiveIntensity: 0.8,
      roughness: 0.35,
      metalness: 0.08
    });
    const mutedMaterial = new THREE.MeshStandardMaterial({
      color: 0x7890b8,
      emissive: 0x121c30,
      emissiveIntensity: 0.5,
      roughness: 0.65,
      metalness: 0.1
    });

    const nodes: THREE.Mesh[] = [];
    const nodePositions = createMemoryPositions();

    for (const [index, position] of nodePositions.entries()) {
      const node = new THREE.Mesh(
        nodeGeometry,
        index % 5 === 0
          ? accentMaterial
          : index % 3 === 0
            ? primaryMaterial
            : mutedMaterial
      );
      node.position.copy(position);
      node.scale.setScalar(index % 5 === 0 ? 1.7 : 1);
      nodes.push(node);
      root.add(node);
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8ba7d8,
      transparent: true,
      opacity: 0.26
    });
    const highlightLineMaterial = new THREE.LineBasicMaterial({
      color: 0x9df6b8,
      transparent: true,
      opacity: 0.55
    });
    const connections = createConnections(nodePositions);

    for (const [index, connection] of connections.entries()) {
      const geometry = new THREE.BufferGeometry().setFromPoints(connection);
      root.add(
        new THREE.Line(
          geometry,
          index % 4 === 0 ? highlightLineMaterial : lineMaterial
        )
      );
    }

    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d2a41,
      emissive: 0x0c1526,
      emissiveIntensity: 0.7,
      roughness: 0.82,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.68
    });
    const ribbon = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.8, 0.012, 180, 8, 2, 5),
      ribbonMaterial
    );
    ribbon.rotation.set(0.5, 0.2, -0.35);
    root.add(ribbon);

    const ambientLight = new THREE.AmbientLight(0xbdd0ee, 1.4);
    const keyLight = new THREE.PointLight(0xa8fac3, 11, 18);
    keyLight.position.set(2.6, 2.1, 3.4);
    const rimLight = new THREE.PointLight(0x7ea5ff, 8, 20);
    rimLight.position.set(-3.4, -1.7, 4.2);
    scene.add(ambientLight, keyLight, rimLight);

    let frameId = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const { height, width } = container.getBoundingClientRect();
      const nextWidth = Math.max(width, 1);
      const nextHeight = Math.max(height, 1);

      renderer.setSize(nextWidth, nextHeight, false);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      root.rotation.y = elapsed * 0.08;
      root.rotation.x = Math.sin(elapsed * 0.25) * 0.08;
      ribbon.rotation.z = -0.35 + elapsed * 0.045;
      ribbon.rotation.y = 0.2 + Math.sin(elapsed * 0.22) * 0.16;

      for (const [index, node] of nodes.entries()) {
        const pulse = 1 + Math.sin(elapsed * 1.3 + index) * 0.12;
        node.scale.setScalar((index % 5 === 0 ? 1.7 : 1) * pulse);
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      nodeGeometry.dispose();
      primaryMaterial.dispose();
      accentMaterial.dispose();
      mutedMaterial.dispose();
      lineMaterial.dispose();
      highlightLineMaterial.dispose();
      ribbon.geometry.dispose();
      ribbonMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
};

const createMemoryPositions = () => {
  return Array.from({ length: 30 }, (_, index) => {
    const layer = index % 3;
    const angle = index * 1.42;
    const radius = 1.05 + layer * 0.52 + (index % 4) * 0.08;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle * 0.78) * (0.88 + layer * 0.18);
    const z = Math.sin(angle) * radius * 0.74 + (layer - 1) * 0.28;

    return new THREE.Vector3(x, y, z);
  });
};

const createConnections = (positions: THREE.Vector3[]) => {
  const connections: THREE.Vector3[][] = [];

  for (let index = 0; index < positions.length; index += 1) {
    connections.push([
      positions[index],
      positions[(index + 3) % positions.length]
    ]);

    if (index % 4 === 0) {
      connections.push([
        positions[index],
        positions[(index + 9) % positions.length]
      ]);
    }
  }

  return connections;
};
