# Advanced Insights UI Structure

## Sidebar Navigation (Updated)

```
┌─────────────────────────────┐
│  📊 Overview                │
│  🛠️  Skills                  │
│  💡 Improvements            │
│  🎯 Interview               │
│  ✨ Advanced Insights [PRO] │  ← NEW
└─────────────────────────────┘
```

## Advanced Insights Section Layout

### Header
```
Advanced Insights (Premium)
```

### Four Locked Premium Cards (2x2 Grid)

#### Card 1: Industry Comparison
```
┌─────────────────────────────────┐
│  🔒 UNLOCK PREMIUM             │
│                                 │
│  Your Level vs Industry Average │
│  [████░░░░] 75%                 │
│                                 │
│  Skill Gap Analysis             │
│  Detailed breakdown...          │
└─────────────────────────────────┘
```

#### Card 2: Recruiter Tips  
```
┌─────────────────────────────────┐
│  🔒 UNLOCK PREMIUM             │
│                                 │
│  💼 Expert Suggestions          │
│  📊 What Recruiters Look For    │
│  🎯 Role-Specific Tips          │
└─────────────────────────────────┘
```

#### Card 3: Formatting Optimization
```
┌─────────────────────────────────┐
│  🔒 UNLOCK PREMIUM             │
│                                 │
│  ✓ ATS-Friendly Format          │
│  ✓ Visual Hierarchy Guide       │
│                                 │
│  Professional Presentation Tips │
└─────────────────────────────────┘
```

#### Card 4: Experience Enhancement
```
┌─────────────────────────────────┐
│  🔒 UNLOCK PREMIUM             │
│                                 │
│  📝 AI Bullet Suggestions       │
│  📈 Impact Metrics              │
│  ✨ Action Verb Optimization    │
└─────────────────────────────────┘
```

### Upgrade CTA Section
```
┌──────────────────────────────────────┐
│  ⭐ Unlock Advanced Insights         │
│                                      │
│  Get premium analysis &              │
│  expert recommendations              │
│                                      │
│  🎯 Industry Comparison              │
│  💼 Recruiter Tips                   │
│  ✨ Experience Enhancement           │
│  📐 Format Optimization              │
│                                      │
│  [🚀 UPGRADE TO PREMIUM]             │
└──────────────────────────────────────┘
```

## Color Coding

| Feature | Color | Theme |
|---------|-------|-------|
| Industry Comparison | Cyan | Tech/Analytics |
| Recruiter Tips | Pink | Expertise |
| Formatting | Green | Success |
| Experience | Orange | Creativity |
| Upgrade CTA | Amber/Orange | Premium/Gold |

## Lock Icon Design

```
    ┌─────────────┐
    │     🔒      │
    │   ╭─────╮   │
    │  │       │  │
    │  │ █████ │  │
    │   ╰─────╯   │
    └─────────────┘
    
Lock Overlay Features:
✓ Semi-transparent backdrop blur
✓ Centered lock icon
✓ "Unlock Premium" text
✓ Hover blur enhancement
✓ Gradient background (slate-900/40)
```

## Responsive Behavior

### Desktop (2x2 Grid)
```
[Card 1] [Card 2]
[Card 3] [Card 4]
```

### Tablet/Mobile (1 Column)
```
[Card 1]
[Card 2]
[Card 3]
[Card 4]
```

### Upgrade CTA (Full Width)
```
[    Upgrade CTA (Full Width)    ]
```

## State Management

```
activeSection = 'advanced'
  ↓
Show Advanced Insights Section
  ↓
Display 4 locked premium cards
  ↓
Show upgrade CTA
  ↓
User clicks button → showUpgradeModal = true
  ↓
[Open subscription/payment modal]
```

## Animation Timeline

- Section Load: fade-in (0s)
- Card 1: slide-in from left + fade (0.35s)
- Card 2: slide-in from right + fade (0.40s)
- Card 3: slide-in from left + fade (0.45s)
- Card 4: slide-in from right + fade (0.50s)
- Upgrade CTA: fade-in + scale (0.55s)

## Dark Mode Adjustments

- Lock overlay: darker blue tint
- Text: light slate colors
- Cards: dark slate backgrounds
- Gradients: adapted for dark surfaces

---

**Ready to integrate with payment gateway!**
