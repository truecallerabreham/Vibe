# Arc - Architecture Canvas

Design production-grade architectures by learning from real open-source projects.

## Installation

```bash
npm install -g arc
```

## Configuration

Set these environment variables or add them to `~/.arcrc`:

| Variable | Description |
|----------|-------------|
| `ARC_OPENROUTER_KEY` | OpenRouter API key for LLM calls |
| `GITHUB_TOKEN` | GitHub personal access token for API search |
| `ARC_GITDIAGRAM_URL` | URL of your GitDiagram instance (default: `http://localhost:3001`) |
| `ARC_OPENROUTER_MODEL` | Model to use (default: `deepseek/deepseek-v4-flash:floor`) |

### ~/.arcrc example

```yaml
openrouter_key: sk-or-v1-...
github_token: ghp_...
```

## Usage

```bash
# Find repos and open the design canvas
arc build "customer support ai agent"

# Just discover relevant repos without the canvas
arc discover "video editor backend"

# Help
arc --help
```

## How it works

1. You describe your project idea
2. Arc searches GitHub for the most architecturally relevant open-source repos
3. For each repo, it generates a validated architecture diagram via GitDiagram
4. A local web canvas opens showing reference architectures side-by-side
5. You drag components from reference designs into your own architecture
6. Each component shows deep detail: purpose, trade-offs, alternatives
7. When ready, AI reviews your design and suggests improvements

## Architecture

```
CLI (commander) → GitHub Search → GitDiagram API → Local Web Server → React Flow Canvas
```

## Development

```bash
git clone https://github.com/your-username/arc.git
cd arc
npm install
cd web && npm install && cd ..
npm run build:all
```

## GitDiagram Setup

Arc requires a running GitDiagram instance. Fork and deploy:

```bash
git clone https://github.com/ahmedkhaleel2004/gitdiagram.git
cd gitdiagram
# Set up environment with OpenRouter key
npm install && npm run dev
```
