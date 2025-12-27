// Avatar model utilities
// This file helps manage avatar model loading

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const AVATAR_MODEL_URLS = {
  // Free photorealistic models
  // Option 1: ReadyPlayerMe (free tier) - requires signup
  readyplayerme: 'https://models.readyplayer.me/YOUR_ID.glb',

  // Option 2: Sketchfab free models
  sketchfab: 'https://sketchfab.com/models/[MODEL_ID]/download',

  // Option 3: Local fallback
  local: '/avatar/model.glb',
}

export async function loadAvatarModel(url: string) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => resolve(gltf),
      (progress) => console.log('Loading avatar:', (progress.loaded / progress.total) * 100, '%'),
      (error) => reject(error)
    )
  })
}

export const RECOMMENDED_MODELS = [
  {
    name: 'Free ReadyPlayerMe Avatar',
    description: 'Photorealistic avatar creation with customization',
    url: 'https://readyplayer.me',
  },
  {
    name: 'Mixamo Avatar',
    description: 'Free rigged 3D character models',
    url: 'https://www.mixamo.com',
  },
  {
    name: 'Sketchfab Free Models',
    description: 'Search for "avatar" or "character" with CC0 license',
    url: 'https://sketchfab.com',
  },
]
