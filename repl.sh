#!/bin/bash

# Unified Clojure REPL Launcher
# Usage: ./repl.sh [jvm|cljs|all] [port]

set -e

RUNTIME=${1:-"all"}
JVM_PORT=${2:-7888}
CLJS_PORT=${3:-9000}

echo "🚀 Starting Unified Clojure Development Environment"
echo "Runtime: $RUNTIME"
echo "JVM Port: $JVM_PORT"
echo "CLJS Port: $CLJS_PORT"

# Function to start JVM REPL
start_jvm_repl() {
    echo "📦 Starting JVM REPL on port $JVM_PORT..."
    clojure -M:repl -J-Djdk.attach.allowAttachSelf -J-Xmx2g -J-Xss2m -J-XX:+UseG1GC &
    JVM_PID=$!
    echo "JVM REPL started with PID: $JVM_PID"
}

# Function to start CLJS REPL
start_cljs_repl() {
    echo "🌐 Starting ClojureScript REPL on port $CLJS_PORT..."
    shadow-cljs cljs-repl --port $CLJS_PORT &
    CLJS_PID=$!
    echo "CLJS REPL started with PID: $CLJS_PID"
}

# Function to start MCP server
start_mcp() {
    echo "🔌 Starting Clojure-MCP server..."
    clojure -X:mcp &
    MCP_PID=$!
    echo "MCP server started with PID: $MCP_PID"
}

# Function to start Shadow-CLJS watch
start_shadow_watch() {
    echo "👀 Starting Shadow-CLJS watch..."
    shadow-cljs watch &
    SHADOW_PID=$!
    echo "Shadow-CLJS watch started with PID: $SHADOW_PID"
}

# Main execution
case $RUNTIME in
    "jvm")
        start_jvm_repl
        echo "✅ JVM REPL running on port $JVM_PORT"
        echo "Connect with: clj --m nrepl.cmdline --connect $JVM_PORT"
        ;;
    "cljs")
        start_cljs_repl
        echo "✅ CLJS REPL running on port $CLJS_PORT"
        echo "Connect with: shadow-cljs cljs-repl --port $CLJS_PORT"
        ;;
    "all")
        echo "🔄 Starting all services..."
        start_jvm_repl
        sleep 2
        start_cljs_repl
        sleep 2
        start_mcp
        sleep 2
        start_shadow_watch
        
        echo "✅ All services started!"
        echo "JVM REPL: port $JVM_PORT"
        echo "CLJS REPL: port $CLJS_PORT"
        echo "MCP Server: port 7888"
        echo "Shadow-CLJS: watching all builds"
        ;;
    "mcp")
        start_mcp
        echo "✅ MCP server running on port 7888"
        ;;
    "shadow")
        start_shadow_watch
        echo "✅ Shadow-CLJS watching all builds"
        ;;
    *)
        echo "❌ Unknown runtime: $RUNTIME"
        echo "Usage: $0 [jvm|cljs|all|mcp|shadow] [jvm_port] [cljs_port]"
        exit 1
        ;;
esac

# Wait for background processes
if [[ "$RUNTIME" == "all" ]]; then
    echo "📝 Press Ctrl+C to stop all services"
    wait
else
    echo "📝 Press Ctrl+C to stop the service"
    wait
fi