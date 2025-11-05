# OpenCode Hub

> Centralized coordination system for OpenCode development and distribution

## Overview

OpenCode Hub provides centralized package management, development workflow coordination, and distribution infrastructure for the OpenCode ecosystem.

## Key Features

- **Package Management**: Centralized package distribution and versioning
- **Development Coordination**: Workflow orchestration across multiple projects
- **Configuration Management**: Centralized configuration and settings
- **Distribution Pipeline**: Automated packaging and release management

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build packages
pnpm build

# Run tests
pnpm test

# Package for distribution
pnpm package

# Publish packages
pnpm publish
```

## Code Style

- **TypeScript**: Strict type checking and ESM modules
- **Package Structure**: Consistent package organization
- **Version Management**: Semantic versioning and changelog
- **Documentation**: Comprehensive README and API docs

## Cross-Repository Integration

### Related Tools
- **[opencode-openai-codex-auth](../opencode-openai-codex-auth/)**: Plugin distribution and management
- **[stt](../stt/)**: Development branch coordination
- **[promethean](../promethean/)**: Package-based architecture patterns
- **[moofone/codex-ts-sdk](../moofone/codex-ts-sdk/)**: SDK distribution

### 🔗 Comprehensive Cross-References
- **[CROSS_REFERENCES.md](./CROSS_REFERENCES.md)** - Complete cross-references to all related repositories
- **[Workspace AGENTS.md](../AGENTS.md)** - Main workspace documentation
- **[Repository Index](../REPOSITORY_INDEX.md)** - Complete repository overview

### Integration Patterns
1. **Plugin Distribution**: Package and distribute opencode-openai-codex-auth
2. **Development Coordination**: Manage stt branch development
3. **Package Management**: Coordinate promethean package distribution
4. **SDK Distribution**: Manage moofone/codex-ts-sdk releases

## Package Management

### Plugin Packages
```bash
# Package OpenCode plugins
pnpm package:plugin

# Publish to registry
pnpm publish:plugin

# Update plugin registry
pnpm update:registry
```

### Development Packages
```bash
# Package development tools
pnpm package:dev

# Create distribution bundles
pnpm bundle

# Generate documentation
pnpm docs:generate
```

### Version Management
```bash
# Bump version
pnpm version:patch
pnpm version:minor
pnpm version:major

# Generate changelog
pnpm changelog
```

## Distribution Pipeline

### Build Process
1. **Source Compilation**: TypeScript to JavaScript
2. **Bundle Creation**: Package optimization and bundling
3. **Documentation Generation**: API docs and guides
4. **Quality Assurance**: Testing and validation

### Release Process
1. **Version Bump**: Semantic versioning
2. **Changelog Update**: Automatic changelog generation
3. **Package Creation**: Distribution bundles
4. **Registry Publish**: Automated publishing

## Configuration Management

### Centralized Configuration
```typescript
interface HubConfig {
  packages: PackageConfig[];
  registry: RegistryConfig;
  build: BuildConfig;
  distribution: DistributionConfig;
}
```

### Package Configuration
```typescript
interface PackageConfig {
  name: string;
  version: string;
  main: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}
```

## Development Workflow

### Package Development
1. **Create Package**: Initialize new package structure
2. **Development**: Implement package functionality
3. **Testing**: Comprehensive test coverage
4. **Documentation**: API docs and usage guides
5. **Packaging**: Create distribution bundle

### Integration Testing
1. **Local Testing**: Test package integration locally
2. **Dependency Validation**: Verify dependency compatibility
3. **Cross-Platform**: Test across different environments
4. **Performance**: Validate performance characteristics

## Resources

- [Main Documentation](https://github.com/numman-ali/opencode-hub/blob/main/README.md)
- [Package Documentation](https://github.com/numman-ali/opencode-hub/tree/main/docs)
- [API Reference](https://github.com/numman-ali/opencode-hub/blob/main/docs/api.md)

## Dependencies

### Runtime
- **Node.js**: JavaScript runtime environment
- **pnpm**: Package manager and CLI tools
- **TypeScript**: Type-safe development

### Development
- **Rollup/Vite**: Bundle creation
- **Jest**: Testing framework
- **ESLint**: Code quality and style

## Integration Patterns

### With Plugin Development
- Use hub for opencode-openai-codex-auth distribution
- Automated plugin registration and discovery
- Version compatibility management

### With Development Coordination
- Coordinate stt branch development
- Manage feature branch integration
- Handle merge and release processes

### With Package Management
- Distribute promethean packages
- Manage moofone/codex-ts-sdk releases
- Coordinate version compatibility

## License

Check LICENSE file in repository

## Contributing

1. **Package Structure**: Follow established package patterns
2. **Documentation**: Include comprehensive docs
3. **Testing**: Ensure full test coverage
4. **Version Management**: Use semantic versioning