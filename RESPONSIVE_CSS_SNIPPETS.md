# Mobile Responsive CSS Snippets

Quick reference for making new components responsive.

## 📱 Common Responsive Patterns

### 1. Responsive Grid Layouts

```jsx
// 2-column on desktop, 1-column on mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* items */}
</div>

// 4-column on desktop, 2-column tablet, 1-column mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* items */}
</div>

// 3-column on desktop, 2-column tablet, 1-column mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* items */}
</div>
```

### 2. Responsive Flexbox Layouts

```jsx
// Vertical on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
  {/* items */}
</div>

// Space-between with responsive direction
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  {/* items */}
</div>
```

### 3. Responsive Typography

```jsx
// Scaling text
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Heading
</h1>

// Body text
<p className="text-xs sm:text-sm md:text-base lg:text-lg">
  Body text that scales
</p>

// Small text
<span className="text-xs sm:text-sm">
  Small text
</span>
```

### 4. Responsive Padding/Margin

```jsx
// Box with responsive padding
<div className="p-4 sm:p-6 md:p-8">
  Content
</div>

// Responsive margins
<div className="m-4 sm:m-6 md:m-8">
  Content
</div>

// Responsive gaps between items
<div className="gap-4 sm:gap-6 md:gap-8">
  {/* items */}
</div>
```

### 5. Responsive Container

```jsx
// Full-width on mobile, max-width on desktop
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
  Content
</div>
```

### 6. Responsive Icons

```jsx
// Icon that scales responsively
<Icon className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8" />

// Touch-friendly icon button
<button className="p-2 sm:p-3 rounded-lg hover:bg-gray-100">
  <Icon className="w-5 sm:w-6" />
</button>
```

### 7. Responsive Button

```jsx
// Button with responsive text and padding
<button className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base rounded-lg">
  Click me
</button>

// Full-width on mobile, auto on desktop
<button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3">
  Submit
</button>
```

### 8. Responsive Card

```jsx
// Card with responsive padding and border radius
<div className="rounded-lg sm:rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8">
  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">Title</h3>
  <p className="text-xs sm:text-sm md:text-base text-gray-600">Content</p>
</div>
```

### 9. Responsive Navigation

```jsx
// Mobile hamburger, desktop nav
<nav className="hidden md:flex items-center gap-4">
  {/* Desktop navigation */}
</nav>

<button className="md:hidden" onClick={toggleMenu}>
  {/* Mobile hamburger menu */}
</button>
```

### 10. Responsive Image Container

```jsx
// Aspect ratio maintained on all screens
<div className="aspect-video w-full">
  <img src="..." alt="..." className="w-full h-full object-cover" />
</div>

// Responsive image sizing
<img 
  src="..."
  alt="..."
  className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
/>
```

---

## 🎨 Responsive Color & Effects

### Conditional Styling Based on Screen

```jsx
// Hide on mobile, show on desktop
<div className="hidden md:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="md:hidden">
  Mobile only content
</div>

// Visible on tablet only
<div className="hidden sm:block md:hidden">
  Tablet only content
</div>
```

### Responsive Shadows & Effects

```jsx
// Shadow scales with screen size
<div className="shadow-md md:shadow-lg lg:shadow-xl">
  Content
</div>

// Responsive hover effects
<button className="hover:shadow-md md:hover:shadow-lg transition-shadow">
  Hover me
</button>
```

---

## 📊 Responsive Data Tables

```jsx
// Table with horizontal scroll on mobile
<div className="overflow-x-auto">
  <table className="w-full text-xs sm:text-sm md:text-base">
    <thead>
      <tr>
        <th className="px-2 sm:px-4 py-2 sm:py-3">Header</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b">
        <td className="px-2 sm:px-4 py-2 sm:py-3">Cell</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🎯 Mobile-First Approach

Always build mobile first:

```jsx
// ✅ GOOD - Start mobile, enhance desktop
<div className="text-sm p-4">
  <h1 className="text-xl sm:text-2xl md:text-3xl">Title</h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {/* items */}
  </div>
</div>

// ❌ BAD - Hiding content on mobile
<div className="hidden lg:block">
  This doesn't show on mobile
</div>

// ❌ BAD - Non-responsive sizing
<div style={{width: '1200px', padding: '32px'}}>
  Won't work on mobile
</div>
```

---

## 🔧 Debugging Mobile Issues

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Horizontal scrolling on mobile | Use `max-w-full`, `overflow-hidden`, or `px-4` |
| Text too small on mobile | Use `text-xs sm:text-sm md:text-base` |
| Images overflow | Use `w-full h-auto` or `max-w-full` |
| Buttons too small to tap | Use `min-h-[44px] min-w-[44px]` |
| Spacing too tight | Use responsive gaps: `gap-4 sm:gap-6` |
| Content not centered | Use `mx-auto` with `max-w-*` |
| Layout breaks on tablet | Test breakpoints: 640px, 768px, 1024px |

### Browser DevTools Tips

1. **Chrome**: Press `F12` → Click device toggle (or `Ctrl+Shift+M`)
2. **Firefox**: Press `F12` → Click responsive design mode (or `Ctrl+Shift+M`)
3. **Safari**: Enable developer menu → Responsive Design Mode
4. **Test multiple devices**: Use DevTools presets for various phone models

---

## 📚 Useful Tailwind Classes for Mobile

```
Responsive Display:
- hidden md:block
- md:hidden
- sm:flex
- lg:grid

Responsive Size:
- w-full sm:w-1/2 md:w-1/3
- text-sm sm:text-base md:text-lg
- h-64 sm:h-72 md:h-80

Responsive Spacing:
- p-4 sm:p-6 md:p-8
- m-4 sm:m-6 md:m-8
- gap-4 sm:gap-6 md:gap-8

Responsive Grid:
- grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- grid-cols-2 md:grid-cols-3
```

---

## ✨ Pro Tips

1. **Use Tailwind's `min()` function for scalable sizing:**
   ```jsx
   <div className="p-[min(2rem,5vw)]">
     Padding scales with viewport
   </div>
   ```

2. **Combine responsive classes for fine control:**
   ```jsx
   <div className="text-base sm:text-lg md:text-xl lg:text-2xl">
     Multi-level scaling
   </div>
   ```

3. **Use CSS custom properties for consistency:**
   ```jsx
   <div className="p-[var(--mobile-spacing)] sm:p-[var(--desktop-spacing)]">
     Consistent spacing
   </div>
   ```

4. **Test orientation changes:**
   ```jsx
   {/* Landscape view adjustments */}
   <div className="landscape:flex-row portrait:flex-col">
     Content
   </div>
   ```

---

**Reference**: Tailwind CSS - https://tailwindcss.com/docs/responsive-design
