ALWAYS USE BUN NOT NPM, NEVER STAGE FILES

# Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down.
You are not just writing code. You are shaping the future of this project. The pattern you establish will be copied. The corners you cut will be cut again.Fight entropy. Make the codebase easy to maintain. Use a hard cutover approach and never implement backward compatibility.

# Library Version Awareness

Always prefer retrieval-led reasoning over pre-training-led reasoning. Before implementing with any library (Chakra UI, React Router, React Query, Zod, etc.):

1. **Check `package.json`** for the exact installed version
2. **Then**: use `web-fetch` to get docs for that specific version (APIs change significantly between majors)
3. **Never assume** latest syntax — v5 React Router ≠ v6, TanStack Query v4 ≠ v5, Chakra v2 ≠ v3, etc...

This prevents broken imports, deprecated patterns, and wasted debugging time.

### SKILLS

- When writing code, make sure to follow code-simplifier skill rules and principles `C:\Users\steph\.codex\skills\code-simplifier\SKILL.md`
- When writing front-end design code, make sure to follow frontend-design skill rules and principles `C:\Users\steph\.codex\skills\frontend-design\SKILL.md`
- building-native-ui : Complete guide for building beautiful apps with Expo Router. Covers fundamentals, styling, components, navigation, animations, patterns, and native tabs. `C:\Users\steph\.codex\skills\building-native-ui\SKILL.md`
- For ANY networking work including API requests, data fetching, caching, or network debugging `C:\Users\steph\.codex\skills\native-data-fetching\SKILL.md`
- expo-dev-client : Build and distribute Expo development clients locally or via TestFlight `C:\Users\steph\.codex\skills\expo-dev-client\SKILL.md`
