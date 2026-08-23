@echo off
title NIQ HelpDeskAI - Enterprise IT Support
echo Starting NIQ HelpDeskAI Standalone Desktop Application...
cd /d "%~dp0"

if exist "release\win-unpacked\NIQ HelpDeskAI.exe" (
    start "" "release\win-unpacked\NIQ HelpDeskAI.exe"
) else (
    npx electron .
)
