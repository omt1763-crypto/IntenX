# Avatar Model Setup Guide

## Quick Start: Add Your Avatar Model

The avatar system is ready to use! You just need to add a 3D model file.

### Step 1: Choose Your Model

Pick ONE of these options:

#### Option A: Free ReadyPlayerMe (Recommended)
1. Go to https://readyplayer.me
2. Create a free account
3. Customize your avatar
4. Download as `.glb` format
5. Save as `model.glb` in this folder

#### Option B: Use Mixamo Models
1. Go to https://www.mixamo.com
2. Find a character model
3. Download as `.glb` format
4. Save as `model.glb` in this folder

#### Option C: Sketchfab Free Models
1. Go to https://sketchfab.com
2. Search for "avatar" or "character"
3. Filter by CC0 license
4. Download `.glb` format
5. Save as `model.glb` in this folder

### Step 2: Place Your Model

1. Download your model as a `.glb` file
2. Rename it to `model.glb`
3. Place it in this directory: `/public/avatar/model.glb`

### Step 3: Verify

The avatar system will automatically detect and load your model when you start an interview.

## File Location

```
interviewverse_frontend/
├── public/
│   └── avatar/
│       └── model.glb  ← Place your model here
```

## Avatar Features (Automatic)

Once you add a model, these features activate:

✅ Photorealistic 3D rendering
✅ Real-time lip-sync with speech
✅ Eye blinking every 3-6 seconds
✅ Subtle breathing animation
✅ Emotional expressions (neutral, thinking, happy, serious)
✅ Auto-rotating camera
✅ Professional studio lighting
✅ 60% of screen real estate in interview panel

## Model Requirements

Your `.glb` file should ideally have:

- ✅ Head and facial features
- ✅ Blinking eyes (morphTargets: `eyeBlinkLeft`, `eyeBlinkRight`)
- ✅ Mouth shapes (morphTargets: `mouthOpen`, `mouthWide`, `mouthO`)
- ✅ Facial expressions (optional: `smile`, `frown`)
- ⚠️ File size: Under 50MB recommended (smaller = faster loading)

## If Model Doesn't Load

If your model file isn't detected:

1. **Check file name**: Must be exactly `model.glb`
2. **Check path**: Should be in `/public/avatar/`
3. **Check format**: Must be `.glb` format (not `.gltf`)
4. **Check console**: Look for errors in browser DevTools (F12)
5. **Check file size**: Very large files may fail to load

If still not working, the system will show a **fallback placeholder avatar** (gray sphere with eyes).

## Troubleshooting

### Avatar not appearing
- Ensure model.glb is in `/public/avatar/`
- Check browser console for errors
- Try a smaller model file

### Lip-sync not working
- Web Audio API may be blocked - check browser permissions
- Ensure microphone is enabled during interview

### Performance issues
- Consider using a simpler model with fewer polygons
- Reduce model file size
- Close other browser tabs

## Next Steps

Once your model is added, test it:

1. Go to http://localhost:3000/interview/demo
2. Click "Start Interview"
3. You should see your avatar with:
   - Rotating camera
   - Animated expressions
   - Lip-sync with your speech
   - Metrics overlay

## Need Help?

- ReadyPlayerMe: https://readyplayer.me/help
- Mixamo: https://www.mixamo.com/#/
- Sketchfab: https://sketchfab.com/

Enjoy your AI interview avatar! 🎭
