# Multi-App Setup Guide

This project contains two separate Next.js applications:

## 📁 Project Structure
```
webapp/                     # Main Dalgo webapp
├── src/                   # Main app source code
├── package.json           # Uses yarn
├── yarn.lock             # Yarn lockfile
└── vo_new/               # New VO application
    ├── app/              # VO app source code
    ├── package.json      # Uses npm
    └── package-lock.json # NPM lockfile
```

## ⚡ Version Differences

| Technology | Main Webapp | vo_new | Notes |
|------------|-------------|---------|-------|
| **Next.js** | 14.2.30 | 15.2.4 | Different major versions |
| **React** | 18.3.1 | 19.0.0 | Different major versions |
| **TypeScript** | 5.8.2 | ^5 | Similar versions |
| **Package Manager** | yarn | npm | Different managers |

### How This Works
- **Separate Node.js processes**: Each app runs independently
- **Isolated dependencies**: Each has its own `node_modules`
- **No shared runtime**: Apps don't interact at the JavaScript level
- **Different ports**: 3000 vs 3001 prevent conflicts

## 🚀 Quick Start

### Option 1: Automated Setup
```bash
./setup.sh
```

### Option 2: Manual Setup
```bash
# Install main webapp dependencies (uses yarn)
yarn install

# Install vo_new dependencies (uses npm)
cd vo_new && npm install

cd ..
```

## 🔧 Running the Applications

### Individual Applications
```bash
# Main webapp (port 3000)
yarn dev:webapp

# VO newapp (port 3001)
yarn dev:vo
```

### Both Applications Simultaneously
```bash
yarn dev:both
```

## 🌐 URLs & Ports

| Application | Port | URL | Package Manager |
|-------------|------|-----|-----------------|
| Main webapp | 3000 | http://localhost:3000 | yarn |
| vo_new      | 3001 | http://localhost:3001 | npm  |

## 🐳 Docker Setup

### Running both apps with Docker Compose
```bash
docker-compose -f Docker/docker-compose.multi-app.yaml up
```

## 📝 Important Notes

1. **Separate Dependencies**: Each app has its own `package.json` and `node_modules`
2. **Different Package Managers**: Main app uses yarn, vo_new uses npm
3. **Independent Builds**: Each app must be built separately
4. **Port Configuration**: Ports are configured in package.json scripts
5. **shadcn/ui Dependencies**: vo_new uses shadcn/ui components with all required dependencies included
6. **Version Isolation**: Different React/Next.js versions run independently

## 🛠 Available Scripts

### Main Webapp (root)
- `yarn dev:webapp` - Run main app on port 3000
- `yarn dev:vo` - Run vo_new on port 3001
- `yarn dev:both` - Run both apps simultaneously
- `yarn build` - Build main app
- `yarn start:webapp` - Start built main app

### VO New (vo_new/)
- `npm run dev` - Run on port 3001
- `npm run build` - Build the app
- `npm run start` - Start built app

## 🔄 Development Workflow

1. Run `./setup.sh` for initial setup
2. Use `yarn dev:both` for parallel development
3. Access main app at http://localhost:3000
4. Access vo_new at http://localhost:3001

## 🚨 Troubleshooting

### Port Conflicts
If ports 3000 or 3001 are already in use:
- Kill existing processes: `lsof -ti:3000 | xargs kill -9`
- Or change ports in the respective `package.json` files

### Version Compatibility Issues
- Each app runs independently, so version differences shouldn't cause conflicts
- Issues would only arise if trying to share code between apps
- For production, ensure your deployment environment supports both Node.js versions 