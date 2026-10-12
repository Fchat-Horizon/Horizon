#!/usr/bin/env pwsh

<#
.SYNOPSIS
Packages each unpacked Windows build in electron\dist as a portable zip.

.DESCRIPTION
Adds the horizon-data folder here rather than through electron-builder's
extraFiles, which would also ship it in the NSIS installer.

.PARAMETER DistPath
The electron-builder output directory containing win*-unpacked folders.

.PARAMETER ReleasePath
The directory where the zips are written.

.EXAMPLE
.\windows-portable.ps1 -DistPath "C:\Horizon\electron\dist" -ReleasePath "C:\release"
#>

Param(
    [Parameter(Mandatory = $true)]
    [string]$DistPath,

    [Parameter(Mandatory = $true)]
    [string]$ReleasePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ElectronPath = Split-Path $PSScriptRoot -Parent
$Version = (Get-Content "$ElectronPath\package.json" -Raw | ConvertFrom-Json).version

New-Item -ItemType Directory -Path $ReleasePath -Force | Out-Null

foreach ($Unpacked in Get-ChildItem $DistPath -Directory -Filter "win*-unpacked") {
    # * electron-builder leaves the arch out of the folder name for x64
    $Arch = if ($Unpacked.Name -match '^win-(.+)-unpacked$') { $Matches[1] } else { "x64" }

    $DataPath = Join-Path $Unpacked.FullName "horizon-data"
    New-Item -ItemType Directory -Path $DataPath -Force | Out-Null
    Copy-Item "$ElectronPath\build\portable-readme.txt" -Destination "$DataPath\README.txt"

    $ZipPath = Join-Path $ReleasePath "F-Chat.Horizon-$Version-win-$Arch-portable.zip"
    Compress-Archive -Path "$($Unpacked.FullName)\*" -DestinationPath $ZipPath -Force
}
