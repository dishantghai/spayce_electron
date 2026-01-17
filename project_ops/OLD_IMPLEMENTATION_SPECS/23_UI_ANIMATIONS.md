# Spayce - UI Animations & Transitions

> **Document Purpose**: Complete animation specifications for pixel-perfect recreation of all motion and timing.

---

## Table of Contents

1. [Animation Philosophy](#animation-philosophy)
2. [Timing Constants](#timing-constants)
3. [Easing Curves](#easing-curves)
4. [Hover Effects](#hover-effects)
5. [Expand/Collapse Animations](#expandcollapse-animations)
6. [Page Transitions](#page-transitions)
7. [Loading States](#loading-states)
8. [Micro-interactions](#micro-interactions)
9. [Implementation Reference](#implementation-reference)

---

## Animation Philosophy

### Core Principles

1. **Fast & Responsive**: Most animations under 200ms
2. **Subtle but Present**: Enhance UX without distraction
3. **Consistent Curves**: Same easing for similar interactions
4. **Performance First**: 60fps minimum, use hardware acceleration

### Animation Budget

| Category | Maximum Duration |
|----------|------------------|
| Immediate feedback | 100ms |
| Hover effects | 150ms |
| State changes | 200ms |
| Layout changes | 250ms |
| Page transitions | 300ms |

---

## Timing Constants

```dart
class SpayceAnimations {
  // Duration constants
  static const Duration quick = Duration(milliseconds: 100);
  static const Duration hover = Duration(milliseconds: 150);
  static const Duration fade = Duration(milliseconds: 200);
  static const Duration expand = Duration(milliseconds: 200);
  static const Duration sidebarSlide = Duration(milliseconds: 250);
  static const Duration pageTransition = Duration(milliseconds: 300);
}
```

### Duration Reference Table

| Token | Duration | Use Cases |
|-------|----------|-----------|
| `quick` | 100ms | Button press scale, immediate feedback |
| `hover` | 150ms | Background color change, icon highlights |
| `fade` | 200ms | Opacity transitions, element appears/disappears |
| `expand` | 200ms | Folder expand/collapse, accordion sections |
| `sidebarSlide` | 250ms | Sidebar show/hide, drawer open/close |
| `pageTransition` | 300ms | Screen navigation, modal dialogs |

---

## Easing Curves

```dart
class SpayceAnimations {
  // Standard curve for most transitions
  static const Curve standardCurve = Curves.easeInOut;
  
  // Decelerate for entering elements
  static const Curve decelerateCurve = Curves.decelerate;
  
  // Accelerate for exiting elements
  static const Curve accelerateCurve = Curves.easeIn;
}
```

### Curve Selection Guide

| Scenario | Curve | Reasoning |
|----------|-------|-----------|
| Most interactions | `easeInOut` | Natural, balanced |
| Element entering | `decelerate` | Comes to rest smoothly |
| Element exiting | `easeIn` | Accelerates out of view |
| Spring effects | `easeOutBack` | Playful overshoot |
| Linear progress | `linear` | Constant rate (progress bars) |

### Cubic Bezier Equivalents

For CSS/Web implementation:

| Dart Curve | CSS Equivalent |
|------------|----------------|
| `easeInOut` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `decelerate` | `cubic-bezier(0, 0, 0.2, 1)` |
| `easeIn` | `cubic-bezier(0.4, 0, 1, 1)` |
| `easeOut` | `cubic-bezier(0, 0, 0.2, 1)` |

---

## Hover Effects

### Navigation Button Hover

```
┌─────────────────────────────────────────────┐
│ Before: transparent background              │
│ After:  accentDark (#2D2645) background     │
│ Duration: 150ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
AnimatedContainer(
  duration: SpayceAnimations.hover,
  curve: SpayceAnimations.standardCurve,
  decoration: BoxDecoration(
    color: _isHovered 
      ? SpayceColors.accentDark 
      : Colors.transparent,
    borderRadius: SpayceRadius.buttonRadius,
  ),
)
```

---

### Space Icon Hover

```
┌─────────────────────────────────────────────┐
│ Before: accentColor at 20% opacity          │
│ After:  accentColor at 30% opacity          │
│ Duration: 150ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
AnimatedContainer(
  duration: SpayceAnimations.hover,
  decoration: BoxDecoration(
    color: accentColor.withOpacity(_isHovered ? 0.3 : 0.2),
    borderRadius: BorderRadius.circular(999),
  ),
)
```

---

### Tree Item Hover

```
┌─────────────────────────────────────────────┐
│ Before: transparent background              │
│ After:  white at 5% opacity                 │
│ Duration: 150ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
AnimatedContainer(
  duration: SpayceAnimations.hover,
  decoration: BoxDecoration(
    color: _isHovered 
      ? Colors.white.withOpacity(0.05) 
      : Colors.transparent,
    borderRadius: SpayceRadius.borderRadiusMd,
  ),
)
```

---

### Nav Dot Hover

```
┌─────────────────────────────────────────────┐
│ Before: navDot color, scale 1.0             │
│ After:  textSecondary, scale 1.5            │
│ Duration: 150ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
AnimatedContainer(
  duration: SpayceAnimations.hover,
  width: 4 * (_isHovered ? 1.5 : 1.0),
  height: 4 * (_isHovered ? 1.5 : 1.0),
  decoration: BoxDecoration(
    shape: BoxShape.circle,
    color: _isHovered 
      ? SpayceColors.textSecondary 
      : SpayceColors.navDot,
  ),
)
```

---

### Folder Action Buttons (Appear on Hover)

```
┌─────────────────────────────────────────────┐
│ Before: opacity 0 (hidden)                  │
│ After:  opacity 1 (visible)                 │
│ Duration: 150ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
AnimatedOpacity(
  duration: SpayceAnimations.hover,
  opacity: _isParentHovered ? 1.0 : 0.0,
  child: FolderActionButtons(...),
)
```

---

### Card Hover (Shadow Elevation)

```
┌─────────────────────────────────────────────┐
│ Before: cardSubtle shadow                   │
│         offset: 0, 2px                      │
│         blur: 8px                           │
│         color: black 20%                    │
│                                             │
│ After:  cardHover shadow                    │
│         offset: 0, 4px                      │
│         blur: 16px                          │
│         color: black 30%                    │
│                                             │
│ Duration: 150ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

---

## Expand/Collapse Animations

### Folder Expand/Collapse

```
┌─────────────────────────────────────────────┐
│ Animation: Height from 0 to content height  │
│ Duration: 200ms                             │
│ Curve: easeInOut                            │
│ Chevron: Rotate 90° (collapsed → expanded)  │
└─────────────────────────────────────────────┘
```

#### Chevron Rotation

```dart
AnimatedRotation(
  duration: SpayceAnimations.expand,
  turns: isExpanded ? 0.25 : 0,  // 90 degrees = 0.25 turns
  child: Icon(LucideIcons.chevronRight),
)
```

#### Content Reveal

```dart
AnimatedCrossFade(
  duration: SpayceAnimations.expand,
  crossFadeState: isExpanded 
    ? CrossFadeState.showFirst 
    : CrossFadeState.showSecond,
  firstChild: Column(children: items),
  secondChild: const SizedBox.shrink(),
)
```

---

### Space Expand in Sidebar

```
┌─────────────────────────────────────────────┐
│ Header chevron rotates                      │
│ Content slides down + fades in              │
│ Duration: 200ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

---

## Page Transitions

### Screen Navigation

```
┌─────────────────────────────────────────────┐
│ Type: Fade + Slide                          │
│ Direction: Right (forward), Left (back)     │
│ Duration: 300ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
PageRouteBuilder(
  transitionDuration: SpayceAnimations.pageTransition,
  pageBuilder: (context, animation, secondaryAnimation) => child,
  transitionsBuilder: (context, animation, secondaryAnimation, child) {
    final offsetAnimation = Tween<Offset>(
      begin: const Offset(0.1, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: animation,
      curve: SpayceAnimations.standardCurve,
    ));
    
    final fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: animation,
      curve: SpayceAnimations.standardCurve,
    ));
    
    return FadeTransition(
      opacity: fadeAnimation,
      child: SlideTransition(
        position: offsetAnimation,
        child: child,
      ),
    );
  },
)
```

---

### Modal Dialog Entry

```
┌─────────────────────────────────────────────┐
│ Type: Fade + Scale                          │
│ Scale: 0.95 → 1.0                           │
│ Opacity: 0 → 1                              │
│ Duration: 200ms                             │
│ Curve: decelerate                           │
└─────────────────────────────────────────────┘
```

```dart
showGeneralDialog(
  transitionDuration: SpayceAnimations.fade,
  transitionBuilder: (context, animation, secondaryAnimation, child) {
    return FadeTransition(
      opacity: animation,
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.95, end: 1.0).animate(
          CurvedAnimation(
            parent: animation, 
            curve: Curves.decelerate,
          ),
        ),
        child: child,
      ),
    );
  },
)
```

---

### Sidebar Slide (Overlay Mode)

```
┌─────────────────────────────────────────────┐
│ Type: Slide from left                       │
│ Hidden: left: -320px                        │
│ Visible: left: 0px                          │
│ Duration: 250ms                             │
│ Curve: easeOut (opening), easeIn (closing)  │
└─────────────────────────────────────────────┘
```

```dart
AnimatedPositioned(
  duration: SpayceAnimations.sidebarSlide,
  curve: isVisible ? Curves.easeOut : Curves.easeIn,
  left: isVisible ? 0 : -320,
  top: 0,
  bottom: 0,
  width: 320,
  child: Sidebar(...),
)
```

---

## Loading States

### Progress Bar Animation

```
┌─────────────────────────────────────────────┐
│ Type: Width animation                       │
│ Progress: 0% to 100% of container width     │
│ Duration: Follows WebView progress          │
│ Curve: linear                               │
│ Extra: Shimmer effect on indeterminate      │
└─────────────────────────────────────────────┘
```

```dart
AnimatedContainer(
  duration: const Duration(milliseconds: 100),
  width: progress * constraints.maxWidth,
  height: 2,
  color: SpayceColors.primary,
)
```

---

### Skeleton Loading

```
┌─────────────────────────────────────────────┐
│ Type: Shimmer gradient animation            │
│ Gradient: Move from left to right           │
│ Duration: 1500ms per cycle                  │
│ Loop: Infinite                              │
└─────────────────────────────────────────────┘
```

```dart
AnimatedBuilder(
  animation: _shimmerController,
  builder: (context, child) {
    return ShaderMask(
      shaderCallback: (bounds) {
        return LinearGradient(
          colors: [
            SpayceColors.surfaceDark,
            SpayceColors.accentDark,
            SpayceColors.surfaceDark,
          ],
          stops: [
            _shimmerController.value - 0.3,
            _shimmerController.value,
            _shimmerController.value + 0.3,
          ],
        ).createShader(bounds);
      },
      child: child,
    );
  },
)
```

---

### Spinner/Loading Indicator

```
┌─────────────────────────────────────────────┐
│ Type: Rotation                              │
│ Duration: 1000ms per rotation               │
│ Curve: linear                               │
│ Loop: Infinite                              │
└─────────────────────────────────────────────┘
```

---

## Micro-interactions

### Button Press Scale

```
┌─────────────────────────────────────────────┐
│ On tap down: scale to 0.95                  │
│ On tap up: scale to 1.0                     │
│ Duration: 100ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

```dart
GestureDetector(
  onTapDown: (_) => _scaleController.forward(),
  onTapUp: (_) {
    _scaleController.reverse();
    onTap();
  },
  onTapCancel: () => _scaleController.reverse(),
  child: ScaleTransition(
    scale: Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(
        parent: _scaleController,
        curve: Curves.easeInOut,
      ),
    ),
    child: child,
  ),
)
```

---

### Space Icon Press

```
┌─────────────────────────────────────────────┐
│ On tap down: scale to 0.9                   │
│ On tap up: scale to 1.0                     │
│ Duration: 100ms                             │
│ Curve: easeInOut                            │
└─────────────────────────────────────────────┘
```

---

### Toast Notification

```
┌─────────────────────────────────────────────┐
│ Entry: Slide up + fade in                   │
│ Duration: 200ms                             │
│ Stay: 3000ms                                │
│ Exit: Fade out                              │
│ Duration: 200ms                             │
└─────────────────────────────────────────────┘
```

---

### Context Menu Appear

```
┌─────────────────────────────────────────────┐
│ Entry: Fade + scale from 0.95               │
│ Duration: 150ms                             │
│ Curve: decelerate                           │
│ Origin: Near click position                 │
└─────────────────────────────────────────────┘
```

---

### Inline Input Field

```
┌─────────────────────────────────────────────┐
│ Appear: Fade in + slight expand             │
│ Duration: 150ms                             │
│ Focus: Immediate (autofocus)                │
│ Disappear: Fade out                         │
│ Duration: 100ms                             │
└─────────────────────────────────────────────┘
```

---

## Implementation Reference

### Flutter Animation Controllers

```dart
// Short animation with auto-reverse
late final _hoverController = AnimationController(
  duration: SpayceAnimations.hover,
  vsync: this,
);

// Long animation for sidebar
late final _slideController = AnimationController(
  duration: SpayceAnimations.sidebarSlide,
  vsync: this,
);

// Infinite rotation for loading
late final _spinController = AnimationController(
  duration: const Duration(milliseconds: 1000),
  vsync: this,
)..repeat();
```

### Dispose Controllers

```dart
@override
void dispose() {
  _hoverController.dispose();
  _slideController.dispose();
  _spinController.dispose();
  super.dispose();
}
```

### Using AnimatedContainer

For simple property transitions, prefer `AnimatedContainer`:

```dart
AnimatedContainer(
  duration: SpayceAnimations.hover,
  curve: SpayceAnimations.standardCurve,
  color: _isHovered ? hoverColor : defaultColor,
  transform: Matrix4.identity()..scale(_isPressed ? 0.95 : 1.0),
)
```

### Using AnimatedSwitcher

For widget replacement:

```dart
AnimatedSwitcher(
  duration: SpayceAnimations.fade,
  child: isLoading 
    ? const LoadingSpinner(key: Key('loading'))
    : Content(key: Key('content')),
)
```

---

## Animation Summary Table

| Animation | Duration | Curve | Trigger |
|-----------|----------|-------|---------|
| Nav button hover bg | 150ms | easeInOut | Mouse enter/exit |
| Space icon hover | 150ms | easeInOut | Mouse enter/exit |
| Space icon press | 100ms | easeInOut | Tap down/up |
| Tree item hover | 150ms | easeInOut | Mouse enter/exit |
| Nav dot hover scale | 150ms | easeInOut | Mouse enter/exit |
| Folder expand | 200ms | easeInOut | Click folder |
| Chevron rotate | 200ms | easeInOut | Expand/collapse |
| Sidebar slide | 250ms | easeOut/easeIn | Toggle visibility |
| Page transition | 300ms | easeInOut | Navigate |
| Modal appear | 200ms | decelerate | Show dialog |
| Context menu | 150ms | decelerate | Right-click |
| Card shadow | 150ms | easeInOut | Mouse enter/exit |
| Progress bar | 100ms | linear | Load progress |
| Toast slide | 200ms | easeOut | Show notification |
| Button press | 100ms | easeInOut | Tap |

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
