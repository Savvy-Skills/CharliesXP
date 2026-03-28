import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Map as MapboxMap, CustomLayerInterface } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';

interface ModelLayerOptions {
  id: string;
  url: string;
  origin: [number, number]; // [lng, lat]
  altitude?: number;
  scale?: number;
  rotation?: [number, number, number]; // [x, y, z] in degrees
  onClick?: () => void;
}

export function createModelLayer(options: ModelLayerOptions): CustomLayerInterface {
  const {
    id,
    url,
    origin,
    altitude = 0,
    scale = 1,
    rotation = [90, 0, 0],
    onClick,
  } = options;

  let camera: THREE.Camera;
  let scene: THREE.Scene;
  let model: THREE.Group | null = null;
  let renderer: THREE.WebGLRenderer;
  let map: MapboxMap;
  let raycaster: THREE.Raycaster;
  let isHovered = false;
  let currentScale = 1;
  let targetScale = 1;

  const mercator = mapboxgl.MercatorCoordinate.fromLngLat(origin, altitude);
  const modelTransform = {
    translateX: mercator.x,
    translateY: mercator.y,
    translateZ: mercator.z ?? 0,
    rotateX: (rotation[0] * Math.PI) / 180,
    rotateY: (rotation[1] * Math.PI) / 180,
    rotateZ: (rotation[2] * Math.PI) / 180,
    scale: mercator.meterInMercatorCoordinateUnits() * scale,
  };

  function screenToNDC(e: MouseEvent, canvas: HTMLCanvasElement): THREE.Vector2 {
    const rect = canvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  function hitTest(e: MouseEvent): boolean {
    if (!model || !camera || !raycaster) return false;
    const ndc = screenToNDC(e, map.getCanvas());
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(model, true);
    return hits.length > 0;
  }

  function handleMouseMove(e: MouseEvent) {
    const hit = hitTest(e);
    if (hit && !isHovered) {
      isHovered = true;
      targetScale = 1.15;
      map.getCanvas().style.cursor = 'pointer';
      map.triggerRepaint();
    } else if (!hit && isHovered) {
      isHovered = false;
      targetScale = 1;
      map.getCanvas().style.cursor = '';
      map.triggerRepaint();
    }
  }

  function handleClick(e: MouseEvent) {
    if (hitTest(e) && onClick) {
      onClick();
    }
  }

  const layer: CustomLayerInterface = {
    id,
    type: 'custom',
    renderingMode: '3d',

    onAdd(_map: MapboxMap, gl: WebGLRenderingContext) {
      map = _map;

      camera = new THREE.Camera();
      scene = new THREE.Scene();
      raycaster = new THREE.Raycaster();

      const ambient = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambient);

      const directional1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directional1.position.set(0, 70, 100).normalize();
      scene.add(directional1);

      const directional2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directional2.position.set(0, -70, 50).normalize();
      scene.add(directional2);

      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          model = gltf.scene;
          scene.add(model);
          map.triggerRepaint();
        },
        undefined,
        (error) => {
          console.error('Failed to load 3D model:', error);
        },
      );

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;

      map.getCanvas().addEventListener('mousemove', handleMouseMove);
      map.getCanvas().addEventListener('click', handleClick);
    },

    onRemove() {
      map.getCanvas().removeEventListener('mousemove', handleMouseMove);
      map.getCanvas().removeEventListener('click', handleClick);
      if (!isHovered) return;
      map.getCanvas().style.cursor = '';
    },

    render(_gl: WebGLRenderingContext, matrix: number[]) {
      const t = modelTransform;

      // Smooth scale lerp for hover effect
      currentScale += (targetScale - currentScale) * 0.15;
      if (Math.abs(targetScale - currentScale) > 0.001) {
        map.triggerRepaint();
      }

      const s = t.scale * currentScale;

      const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), t.rotateX);
      const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), t.rotateY);
      const rotZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), t.rotateZ);

      const l = new THREE.Matrix4()
        .makeTranslation(t.translateX, t.translateY, t.translateZ)
        .scale(new THREE.Vector3(s, -s, s))
        .multiply(rotX)
        .multiply(rotY)
        .multiply(rotZ);

      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);

      renderer.resetState();
      renderer.render(scene, camera);

      if (Math.abs(targetScale - currentScale) > 0.001) {
        map.triggerRepaint();
      }
    },
  };

  return layer;
}
