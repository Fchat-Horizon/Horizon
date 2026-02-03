{
  description = "Horizon dev environment";

  inputs = {
    # why is NixPKGS stable only on Electron 33 as of writing?? (2026-01-06)
    nixpkgs. url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils. url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }: 
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_22;
        pnpm = nodejs.pkgs. pnpm;
        electron = pkgs.electron_39;
      in
      {
        devShells.default = pkgs. mkShell {
          name = "fchat-horizon-dev";

          buildInputs = [
            nodejs
            pkgs.bashInteractive
            pnpm
            electron
            pkgs.python3
            pkgs.imagemagick
            pkgs.auto-patchelf
          ];

          shellHook = ''
            export SHELL="${pkgs.bashInteractive}/bin/bash"
            echo "Horizon development environment"
            echo "Node version:  $(node --version)"
            echo "pnpm version:  $(pnpm --version)"
            echo "Electron version: ${electron.version}"
            
            # Set up pnpm config
            pnpm config set manage-package-manager-versions false 2>/dev/null || true
            
            # Set Electron environment variables
            export ELECTRON_SKIP_BINARY_DOWNLOAD=1
            export ELECTRON_OVERRIDE_DIST_PATH=${electron}/bin/
            
            patch_sass_embedded() {
              echo "Patching sass-embedded binaries..."
              
              # Patch root node_modules
              if [ -d "./node_modules/.pnpm" ]; then
                for dir in ./node_modules/.pnpm/sass-embedded-linux-x64*; do
                  if [ -d "$dir" ]; then
                    echo "  Patching $dir"
                    chmod -R +w "$dir"
                    ${pkgs.auto-patchelf}/bin/auto-patchelf --paths "$dir"
                    chmod -R -w "$dir"
                  fi
                done
              fi
              
              # Patch electron node_modules
              if [ -d "./electron/node_modules/.pnpm" ]; then
                for dir in ./electron/node_modules/.pnpm/sass-embedded-linux-x64*; do
                  if [ -d "$dir" ]; then
                    echo "  Patching $dir"
                    chmod -R +w "$dir"
                    ${pkgs.auto-patchelf}/bin/auto-patchelf --paths "$dir"
                    chmod -R -w "$dir"
                  fi
                done
              fi
              
              echo "sass-embedded patching complete!"
            }
            
            export -f patch_sass_embedded
            
            echo ""
            echo "To install dependencies:"
            echo "  pnpm install"
            echo "  patch_sass_embedded  # Run this after installing dependencies!"
            echo ""
            echo "To build and watch, run from the root directory:"
            echo "  pnpm watch"
            echo ""
            echo "To build the Electron app:"
            echo "  pnpm build"
            echo ""
            echo "To build the release version:"
            echo "  pnpm build:dist"
            echo ""
            echo "To start your local build"
            echo "  pnpm build:dist"
            echo ""
            echo "For packaging instructions, please see CONTRIBUTING.md"
            echo ""
            echo "Double warning!!: Run 'patch_sass_embedded' after pnpm install to fix sass-embedded. It won't work in the Nix shell otherwise!!"
          '';
        };
      }
    );
}
