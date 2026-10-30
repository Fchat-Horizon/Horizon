#!/usr/bin/env pwsh

<#
.SYNOPSIS
Windows dev/PR build script for F-Chat Horizon.
Builds the portable app folder only (no installer, no signtool/elevate).

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
pnpm run webpack:dev
if ($Arch) {
    node build/build.mjs --os windows --format dir --arch $Arch
} else {
    node build/build.mjs --os windows --format dir
}

& "$PSScriptRoot\windows-portable.ps1" -DistPath $DistPath -ReleasePath $ReleasePath -NoArchive
