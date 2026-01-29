# 🎨 Premium Fintech Design - Visual Examples

## Before & After Comparisons

### Hero Section

#### Before (Basic)
```tsx
<h1>Stock Screening Results</h1>
<p>Minervini Trend Template (8 Criteria) - {stocks.length} stocks screened</p>
```

#### After (Premium Fintech)
```tsx
<div className="flex items-center gap-3">
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg glow-effect">
    <svg>...</svg>
  </div>
  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-primary-light bg-clip-text text-transparent">
    Stock Screening
  </h1>
</div>
<p className="text-text-secondary text-lg ml-15">
  Advanced Technical Analysis • {stocks.length} Stocks Analyzed • 14 Explainable Filters
</p>
```

**Improvements**:
- Gradient title text (white → teal)
- Icon with glow effect
- More descriptive subtitle
- Better visual hierarchy

---

### Stats Cards

#### Before (Basic)
```tsx
<div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
  <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Screened</p>
  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
    {stocks.length}
  </p>
</div>
```

#### After (Premium)
```tsx
<div className="stat-card group">
  <div className="flex items-center justify-between mb-3">
    <span className="text-text-secondary text-sm font-medium">Total Screened</span>
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
      <svg className="w-5 h-5 text-primary">...</svg>
    </div>
  </div>
  <p className="metric-value">{stocks.length}</p>
  <p className="text-xs text-text-secondary mt-2">Stocks analyzed</p>
</div>
```

**Improvements**:
- Icon with color-coded background
- Gradient number text (white → primary teal)
- Hover effect on icon
- Better spacing and typography
- Glow effect on success/danger cards

---

### Filter Buttons

#### Before (Basic)
```tsx
<button className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-neutral-100'}`}>
  All ({stocks.length})
</button>
```

#### After (Premium)
```tsx
<button className={`filter-tag ${filter === 'all' ? 'filter-tag-active' : ''}`}>
  All ({stocks.length})
</button>
```

**Improvements**:
- Pill shape (rounded-full)
- Gradient background when active
- Glow effect on active state
- Smooth hover transitions
- Color-coded (green for qualified, red for failed)

---

### Table

#### Before (Basic)
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th>Symbol</th>
      <th>Company</th>
      <th>Price</th>
    </tr>
  </thead>
</table>
```

#### After (Premium)
```tsx
<table className="table-premium">
  <thead>
    <tr>
      <th className="rounded-tl-lg">Symbol</th>
      <th>Company</th>
      <th>Price</th>
    </tr>
  </thead>
</table>
```

**Improvements**:
- Sticky header with backdrop blur
- Professional typography (uppercase, letter-spacing)
- Hover effects on rows
- Gradient progress bars for scores
- JetBrains Mono for symbols/prices
- Rounded corners on first/last headers

---

### Modal

#### Before (Basic)
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl">
    {/* Content */}
  </div>
</div>
```

#### After (Premium)
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
  <div className="relative w-full max-w-5xl card-premium animate-scale-in rounded-2xl">
    {/* Content */}
  </div>
</div>
```

**Improvements**:
- Backdrop blur effect
- Scale-in animation
- Card styling (glassmorphism)
- Sticky header in modal
- Smooth transitions

---

## Color Usage Examples

### Success States (Green)
```tsx
{/* Badge */}
<span className="badge-success">
  <span className="status-dot-success"></span>
  Qualified
</span>

/* Card */}
<div className="stat-card-success">
  <p className="metric-value" style={{
    background: 'linear-gradient(135deg, #FFFFFF 0%, #10B981 100%)'
  }}>
    {count}
  </p>
</div>

/* Progress Bar */
<div className="progress-bar-fill bg-gradient-to-r from-success to-success-light" />
```

### Danger States (Red)
```tsx
{/* Badge */}
<span className="badge-danger">
  <span className="status-dot-danger"></span>
  Failed
</span>

/* Card */
<div className="stat-card-danger">
  <p className="metric-value" style={{
    background: 'linear-gradient(135deg, #FFFFFF 0%, #EF4444 100%)'
  }}>
    {count}
  </p>
</div>

/* Progress Bar */
<div className="progress-bar-fill bg-gradient-to-r from-danger to-danger-light" />
```

---

## Typography Examples

### Heading with Gradient
```tsx
<h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-primary-light bg-clip-text text-transparent">
  Stock Screening
</h1>
```

### Metric Numbers
```tsx
<p className="metric-value">
  {count}
</p>

<style>
.metric-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.875rem;
  font-weight: 700;
  background: linear-gradient(135deg, #FFFFFF 0%, #00D4AA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
```

### Stock Symbols
```tsx
<td className="font-mono font-bold text-white group-hover:text-primary transition-colors">
  {stock.symbol}
</td>
```

---

## Animation Examples

### Fade In (Page Load)
```tsx
<div className="animate-fade-in">
  {/* Appears with fade in */}
</div>
```

### Slide Up (Content Sections)
```tsx
<div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
  {/* Slides up from below */}
</div>
```

### Scale In (Modal)
```tsx
<div className="animate-scale-in">
  {/* Scales up from 95% to 100% */}
</div>
```

### Staggered Fade In (Table Rows)
```tsx
{stocks.map((stock, index) => (
  <tr style={{ animation: `fadeIn 0.3s ease-out ${index * 0.02}s both` }}>
    {/* Each row fades in 0.02s after the previous */}
  </tr>
))}
```

---

## Icon with Background

### Primary Icon
```tsx
<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg glow-effect">
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="..." />
  </svg>
</div>
```

### Icon with Colored Background
```tsx
<div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
  <svg className="w-5 h-5 text-success">...</svg>
</div>
```

### Hover Effect Icon
```tsx
<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
  <svg className="w-5 h-5 text-primary">...</svg>
</div>
```

---

## Responsive Examples

### Stats Grid
```tsx
{/* Mobile: 1 column */}
{/* Tablet: 2 columns */}
{/* Desktop: 4 columns */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="stat-card">...</div>
  <div className="stat-card-success">...</div>
  <div className="stat-card">...</div>
  <div className="stat-card-danger">...</div>
</div>
```

### Filter Buttons
```tsx
<div className="flex flex-wrap gap-2">
  {/* Wraps naturally on mobile */}
  <button className="filter-tag">All</button>
  <button className="filter-tag-active">Qualified</button>
</div>
```

---

## Glassmorphism Card

### Basic Card
```tsx
<div className="card-premium p-6">
  <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
  <p className="text-text-secondary">Card content goes here...</p>
</div>
```

### Card with Icon
```tsx
<div className="card-premium p-6">
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
      <Icon />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">Title</h3>
      <p className="text-text-secondary">Description</p>
    </div>
  </div>
</div>
```

---

## Badge Examples

### Success Badge with Status
```tsx
<span className="badge-success">
  <span className="status-dot-success w-1.5 h-1.5"></span>
  Qualified
</span>
```

### Danger Badge
```tsx
<span className="badge-danger">
  <span className="status-dot-danger w-1.5 h-1.5"></span>
  Failed
</span>
```

### Custom Badge
```tsx
<span className="badge px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
  <span className="status-dot-success"></span>
  Custom Text
</span>
```

---

## Complete Page Structure

```tsx
export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-animated relative">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary opacity-90 pointer-events-none" />

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 lg:p-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          {/* Title with icon and gradient */}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* 4 stat cards */}
        </div>

        {/* Filter Section */}
        <div className="card-premium p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Filter buttons */}
        </div>

        {/* Results */}
        <div className="card-premium overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Table or grid */}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Modal content */}
        </div>
      )}
    </div>
  );
}
```

---

## Custom CSS Classes Reference

### Layout
- `.bg-animated` - Animated gradient background
- `.card-premium` - Premium glassmorphism card
- `.stat-card` - Stats card variant
- `.stat-card-success` - Green glow
- `.stat-card-danger` - Red glow

### Interactive
- `.btn-premium` - Premium button
- `.filter-tag` - Filter button
- `.filter-tag-active` - Active filter
- `.input-premium` - Premium input

### Data Display
- `.table-premium` - Premium table
- `.progress-bar` - Progress bar container
- `.progress-bar-fill` - Progress bar fill
- `.metric-value` - Large numbers

### Indicators
- `.badge-success` - Green badge
- `.badge-danger` - Red badge
- `.badge-warning` - Amber badge
- `.status-dot-success` - Pulsing green dot
- `.status-dot-danger` - Pulsing red dot

### Animations
- `.animate-fade-in` - Fade in
- `.animate-slide-up` - Slide up
- `.animate-scale-in` - Scale in

---

## Usage Quick Reference

### Creating a New Section
```tsx
{/* Section with slide-up animation */}
<div className="section-header animate-slide-up" style={{ animationDelay: '0.2s' }}>
  <h2 className="text-2xl font-bold text-white mb-1">Section Title</h2>
  <p className="text-text-secondary">Section description</p>
</div>
```

### Creating a Card
```tsx
<div className="card-premium p-6 animate-fade-in">
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-white">...</svg>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">Title</h3>
      <p className="text-text-secondary text-sm">Description</p>
    </div>
  </div>
</div>
```

### Creating a Button
```tsx
<button className="btn-premium text-white">
  <span>Click Me</span>
</button>
```

---

## Color Combinations

### Text on Background
```css
/* White text on dark card */
text-white on bg-bg-card

/* Secondary text */
text-text-secondary on bg-bg-card

/* Muted text */
text-text-muted on bg-bg-secondary
```

### Accent Colors
```css
/* Primary accent */
text-primary
bg-primary
border-primary

/* Success accent */
text-success
bg-success/10
bg-success/20

/* Danger accent */
text-danger
bg-danger/10
bg-danger/20
```

---

This document provides visual examples for all the design components. Use these as templates when creating new pages or components!
