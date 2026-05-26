#!/bin/sh
set -eu

MOD_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DEFAULT_GAME_APP="$MOD_ROOT/../../../../.."

if [ -n "${MINDUSTRY_APP:-}" ]; then
    GAME_TARGET=$MINDUSTRY_APP
elif [ -n "${MINDUSTRY_EXE:-}" ]; then
    GAME_TARGET=$MINDUSTRY_EXE
else
    GAME_TARGET=$DEFAULT_GAME_APP
fi

if [ ! -e "$GAME_TARGET" ]; then
    echo "Mindustry app not found. Set MINDUSTRY_APP to your Mindustry.app path, then run this script again."
    exit 1
fi

if [ -d "$GAME_TARGET" ]; then
    open "$GAME_TARGET"
elif [ -x "$GAME_TARGET" ]; then
    "$GAME_TARGET" &
else
    echo "Mindustry executable not found. Set MINDUSTRY_APP to your Mindustry.app path or MINDUSTRY_EXE to your executable path, then run this script again."
    exit 1
fi
