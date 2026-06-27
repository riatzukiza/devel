/**
 * @open-hax/uxx
 * 
 * React component library implementing the @open-hax/uxx contracts.
 * Provides consistent UI components across React applications in the devel workspace.
 * 
 * @example
 * ```tsx
 * import { Button, Badge, Card } from '@open-hax/uxx';
 * 
 * function MyComponent() {
 *   return (
 *     <Card>
 *       <Badge variant="success">Active</Badge>
 *       <Button variant="primary">Click me</Button>
 *     </Card>
 *   );
 * }
 * ```
 */

// Theme runtime
export * from './UxxThemeProvider.js';
export * from './theme.js';

// Primitives
export * from './primitives/index.js';

// Compositions
export * from './compositions/index.js';
