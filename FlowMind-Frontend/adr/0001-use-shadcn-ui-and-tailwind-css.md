# 0001. Use shadcn/ui and Tailwind CSS for UI component layer

## Context and Problem Statement

The chat application needs a UI component library that provides accessible, composable primitives (button, textarea, scroll-area, dialog) while allowing full visual customization. The design calls for a minimal, opinionated visual identity — not a generic framework look. We need tree-shakeable components with no runtime overhead for unused components, and the solution must work with the existing Next.js + TypeScript stack.

## Considered Options

- **shadcn/ui + Tailwind CSS**: Components are copied into the project and customized directly. Full control over styling via Tailwind utility classes. Tree-shakeable by nature. Works with Next.js App Router.
- **Headless UI**: Accessible primitives but requires more custom styling effort. Less component variety than shadcn.
- **Radix Primitives**: Low-level primitives requiring significant assembly. Shadcn is built on top of Radix anyway.
- **MUI / Chakra UI**: Heavy component libraries with fixed theme systems. Hard to achieve a non-generic visual identity. Large bundle size.

## Decision Outcome

Chosen option: "shadcn/ui + Tailwind CSS", because it provides accessible, pre-built components that are fully customizable at the source level, integrates naturally with Tailwind's utility-first approach, and keeps the bundle minimal by only including what we use.

### Consequences

- Good, because every component can be customized directly (no fighting a theme system)
- Good, because unused components don't add to the bundle
- Good, because shadcn/ui is built on Radix primitives — accessibility is built in
- Bad, because upgrading a component means re-copying from the registry and re-applying customizations
