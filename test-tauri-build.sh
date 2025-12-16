#!/bin/bash

# Test Tauri Build Script
# Verifies Rust compilation and Tauri setup

set -e

echo "🔧 Testing Tauri Build..."
echo ""

cd frontend

echo "📦 Step 1: Check Rust installation..."
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not installed. Install from: https://rustup.rs/"
    exit 1
fi
echo "✅ Rust version: $(rustc --version)"
echo ""

echo "📦 Step 2: Check Cargo..."
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found"
    exit 1
fi
echo "✅ Cargo version: $(cargo --version)"
echo ""

echo "📦 Step 3: Check Tauri CLI..."
if ! npm list @tauri-apps/cli &> /dev/null; then
    echo "⚠️ Tauri CLI not installed, installing..."
    npm install --save-dev @tauri-apps/cli
fi
echo "✅ Tauri CLI installed"
echo ""

echo "🔨 Step 4: Check Rust dependencies..."
cd src-tauri
if cargo check 2>&1 | grep -q "error"; then
    echo "❌ Rust compilation errors detected"
    cargo check
    exit 1
fi
echo "✅ Rust dependencies OK"
cd ..
echo ""

echo "🏗️ Step 5: Test Rust build (debug mode)..."
cd src-tauri
if ! cargo build 2>&1; then
    echo "❌ Rust build failed"
    exit 1
fi
echo "✅ Rust build successful"
cd ..
echo ""

echo "📋 Step 6: Verify Tauri commands..."
echo "Checking lib.rs for command registration..."
if grep -q "commands::workspace::" src-tauri/src/lib.rs; then
    echo "✅ Workspace commands registered"
else
    echo "❌ Workspace commands not found in lib.rs"
    exit 1
fi

if grep -q "commands::import_export::" src-tauri/src/lib.rs; then
    echo "✅ Import/Export commands registered"
else
    echo "❌ Import/Export commands not found in lib.rs"
    exit 1
fi
echo ""

echo "📁 Step 7: Verify file structure..."
required_files=(
    "src-tauri/src/commands/workspace.rs"
    "src-tauri/src/commands/import_export.rs"
    "src-tauri/src/commands/file_operations.rs"
    "src/services/workspace/WorkspaceInitializer.ts"
    "src/services/workspace/TauriWorkspaceService.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
        exit 1
    fi
done
echo ""

echo "🎉 ALL TESTS PASSED!"
echo ""
echo "📝 Next Steps:"
echo "   1. Run: npm run tauri dev"
echo "   2. Test workspace initialization"
echo "   3. Create documents and folders"
echo "   4. Verify .md files in ~/Documents/MDReader/"
echo ""
echo "🚀 Tauri desktop app is ready for testing!"

