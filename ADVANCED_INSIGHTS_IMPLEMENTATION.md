# Advanced Insights Implementation Details

## Component State

```typescript
// New state added to ResumeAnalysis component
const [activeSection, setActiveSection] = useState<'overview' | 'skills' | 'improvements' | 'interview' | 'advanced'>('overview')
const [showUpgradeModal, setShowUpgradeModal] = useState(false)
```

## Sidebar Navigation Button

```tsx
<button
  onClick={() => setActiveSection('advanced')}
  className={`w-full text-left px-4 py-3 rounded-lg transition font-semibold text-sm relative ${
    activeSection === 'advanced'
      ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
  }`}
>
  <div className="flex items-center justify-between">
    <span>✨ Advanced Insights</span>
    <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
  </div>
</button>
```

## Lock Overlay Component Pattern

```tsx
{/* Lock Overlay */}
<div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 to-slate-900/20 dark:from-slate-900/60 dark:to-slate-900/40 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10 group-hover:backdrop-blur-md transition">
  <div className="text-center">
    <div className="w-16 h-16 bg-white/20 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30 dark:border-slate-700/30">
      <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    </div>
    <p className="text-white font-bold text-sm">Unlock Premium</p>
    <p className="text-white/70 text-xs mt-1">Upgrade to see insights</p>
  </div>
</div>
```

## Premium Card Container

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.35 }}
  className="relative group"
>
  <div className="bg-gradient-to-br from-white to-cyan-50/20 dark:from-slate-800 dark:to-cyan-950/20 rounded-2xl p-7 border border-cyan-200/40 dark:border-cyan-900/40 shadow-lg relative overflow-hidden">
    {/* Lock Overlay goes here */}
    {/* Content goes here */}
  </div>
</motion.div>
```

## Upgrade CTA Button

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => setShowUpgradeModal(true)}
  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition text-lg"
>
  🚀 Upgrade to Premium
</motion.button>
```

## Section Conditional Rendering

```tsx
{activeSection === 'advanced' && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
      Advanced Insights (Premium)
    </h2>
    
    {/* Four Premium Cards Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Industry Comparison Card */}
      {/* Recruiter Tips Card */}
      {/* Formatting Optimization Card */}
      {/* Experience Enhancement Card */}
    </div>

    {/* Upgrade CTA Section */}
    {/* Upgrade CTA Card */}
  </motion.div>
)}
```

## Styling Features

### Glass-Morphism Lock
- `backdrop-blur-sm` for base blur
- `group-hover:backdrop-blur-md` for enhanced blur on hover
- `bg-white/20` with `border-white/30` for glass effect
- Dark mode: `bg-slate-800/50` with `border-slate-700/30`

### Gradient Backgrounds
- Card base: `bg-gradient-to-br from-white to-[color]-50/20`
- Dark mode: `dark:from-slate-800 dark:to-[color]-950/20`
- Upgrade CTA: `from-amber-500/10 via-orange-500/10 to-red-500/10`

### Opacity for Locked Content
- Locked premium cards: `opacity-50`
- Lock overlay: `z-10` (always on top)
- Content still visible but dimmed

### Responsive Grid
```tsx
className="grid grid-cols-1 lg:grid-cols-2 gap-6"
// Mobile: 1 column
// Desktop: 2 columns
```

## Animation Delays

```typescript
Card 1: transition={{ delay: 0.35 }}
Card 2: transition={{ delay: 0.40 }}
Card 3: transition={{ delay: 0.45 }}
Card 4: transition={{ delay: 0.50 }}
CTA:    transition={{ delay: 0.55 }}
```

## Dark Mode Classes

| Element | Light | Dark |
|---------|-------|------|
| Card background | `from-white` | `dark:from-slate-800` |
| Card gradient | `to-[color]-50/20` | `dark:to-[color]-950/20` |
| Border | `border-[color]-200/40` | `dark:border-[color]-900/40` |
| Icon background | `bg-[color]-100` | `dark:bg-[color]-900/30` |
| Icon color | `text-[color]-600` | `dark:text-[color]-400` |
| Text | `text-slate-900` | `dark:text-white` |

## Integration Points

### For Payment Gateway Integration:
```typescript
onClick={() => setShowUpgradeModal(true)}
// Then open:
// - Stripe modal
// - Paddle modal  
// - Custom payment form
// - External payment page
```

### For Authentication Check:
```typescript
// Conditionally show locked or unlocked content
{isPremiumUser ? (
  <PremiumInsights />
) : (
  <LockedInsights />
)}
```

### For Subscription Status:
```typescript
// Check user subscription on load
useEffect(() => {
  checkUserSubscription().then(isPremium => {
    setIsPremiumUser(isPremium)
  })
}, [])
```

## Performance Considerations

- Lazy load premium content (not rendered until section is active)
- Lock overlay uses CSS transforms (backdrop-blur) for smooth animations
- Motion animations use `initial={{ opacity: 0 }}` for instant loading
- SVG lock icons are inline (no extra HTTP requests)

## Browser Compatibility

- `backdrop-blur`: Modern browsers (Chrome 76+, Safari 9+, Firefox 103+)
- `bg-gradient-to-br`: Tailwind CSS standard
- `dark:` mode: Full support via Tailwind
- SVG icons: Universal support

---

**Code is production-ready and waiting for payment integration!**
