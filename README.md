# IFCX Syntax Support for VS Code

This extension provides syntax highlighting and language support for IFCX files in Visual Studio Code.

## Features

- Syntax highlighting for IFCX files
- Special highlighting for IFCX-specific patterns (e.g., `bsi::name`, `bsi::ifc5::alpha::class`)
- JSON-based syntax with additional IFCX-specific features
- Auto-completion and bracket matching

## Installation

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Press F5 in VS Code to start debugging

## Usage

The extension automatically recognizes files with the `.ifcx` extension. It provides:

- Syntax highlighting for IFCX-specific patterns
- JSON syntax support as a base
- Special highlighting for schema definitions
- Bracket matching and auto-closing pairs

## Development

- Built with TypeScript
- Uses ESLint for code quality
- Follows VS Code extension development best practices

## License

MIT
