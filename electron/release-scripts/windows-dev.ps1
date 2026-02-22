#!/usr/bin/env pwsh

<#
.SYNOPSIS
Windows dev/PR build script for F-Chat Horizon.
Builds portable EXE only (no installer, no signtool/elevate).

.PARAMETER ReleaseVersion
The version string for the release.

.PARAMETER ReleasePath
(Optional) The directory where release artifacts will be stored.

.PARAMETER Arch
(Optional) Target architecture (default: runner native).

.EXAMPLE
.\windows-dev.ps1 -ReleaseVersion "pr-123" -Arch "arm64"
#>

Param(
    [Parameter(Mandatory = $true)]
    [string]$ReleaseVersion,

    [Parameter(Mandatory = $false)]
    [string]$ReleasePath = "$(Get-Location)\release_artifacts\windows\$ReleaseVersion",

    [Parameter(Mandatory = $false)]
    [string]$Arch
)

# state: Enforce strict mode and stop on errors
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Set variables
$RepoRoot = (git rev-parse --show-toplevel)
$DistPath = "$RepoRoot\electron\dist"

# Navigate to repository root
Set-Location $RepoRoot

# Install dependencies
pnpm install --frozen-lockfile

# Build the project
Set-Location electron
Remove-Item -Recurse -Force app, dist -ErrorAction SilentlyContinue
if ($Arch) {
    pnpm run webpack:dev
    node build/build.mjs --os windows --format portable --arch $Arch
} else {
    pnpm build:dev:win
}

# Prepare release directory
New-Item -ItemType Directory -Path $ReleasePath -Force | Out-Null

# Copy portable exe artifact
Copy-Item "$DistPath\*.exe" -Destination "$ReleasePath\" -ErrorAction SilentlyContinue
