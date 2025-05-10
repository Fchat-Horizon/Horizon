#!/usr/bin/env pwsh

<#
.SYNOPSIS
Windows build script for Horizon.

.PARAMETER ReleaseVersion
The version string for the release.

.PARAMETER ReleasePath
(Optional) The directory where release artifacts will be stored.

.EXAMPLE
.\windows.ps1 -ReleaseVersion "v1.0.0" -ReleasePath "C:\path\to\release\artifacts\windows\v1.0.0"
#>

# ! This script requires Git, Node.js, pnpm, and PowerShell Core to be installed.

Param(
    [Parameter(Mandatory = $true)]
    [string]$ReleaseVersion,

    [Parameter(Mandatory = $false)]
    [string]$ReleasePath = "$(Get-Location)\release_artifacts\windows\$ReleaseVersion"
)

# defaults:
#  The default ReleasePath is "$(Get-Location)\release_artifacts\windows\$ReleaseVersion"

# state: Enforce strict mode and stop on errors
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Set variables
# * $RepoRoot: Root directory of the repository
$RepoRoot = (git rev-parse --show-toplevel)
# * $DistPath: Path to the distribution directory
$DistPath = "$RepoRoot\electron\dist"

# Navigate to repository root
Set-Location $RepoRoot

# This is handled by our CI.
# // # & Ensure we're on the 'main' branch and up-to-date
# // git checkout main
# // git pull

# Install dependencies
pnpm install

# Clean previous builds
# ! This will delete the entire $DistPath directory
Remove-Item -Recurse -Force $DistPath -ErrorAction SilentlyContinue

# Build the project
Set-Location electron
# ! Removing 'app' and 'dist' directories to ensure a clean build
Remove-Item -Recurse -Force app, dist -ErrorAction SilentlyContinue
pnpm install
pnpm build:win

# Prepare release directory
# * Create release directory if it doesn't exist
New-Item -ItemType Directory -Path $ReleasePath -Force | Out-Null

# Copy artifacts
# * Copy built executables to the release directory
Copy-Item "$DistPath\*.exe" -Destination "$ReleasePath\" -ErrorAction SilentlyContinue

# TODO: Allow specifying the branch to build from
