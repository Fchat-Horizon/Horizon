{
  description = "Nix Flake for Horizon, including a dev shell for development.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_24;
        pnpm = pkgs.pnpm;
        electron = pkgs.electron_40;
      in
      {
        packages = rec {
          horizon-electron = pkgs.stdenv.mkDerivation rec {
            pname = "horizon-electron";
            version = "latest";
            src = self;

            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit pname version src;
              hash = "sha256-iFzSKQ32vYVREc3kXjzQxgAot+kF7hf1anYEf8SEuBc=";
              pnpm = pkgs.pnpm_9;
              fetcherVersion = 3;
            };

            nativeBuildInputs = [
              pkgs.pnpm_9
              (pkgs.pnpmConfigHook.override { pnpm = pkgs.pnpm_9; })
              nodejs
              pkgs.autoPatchelfHook
              pkgs.copyDesktopItems
            ];

            env = {
              APP_COMMIT = builtins.substring 0 7 (self.dirtyRev or self.rev or "0000000");
            };

            buildInputs = [
              pkgs.stdenv.cc.cc.lib
              pkgs.libsecret
              pkgs.glib
            ];

            desktopItems = [
              (pkgs.makeDesktopItem {
                name = "horizon-electron";
                exec = "@out@/bin/horizon-electron %U";
                icon = "horizon-electron";
                desktopName = "Horizon";
                comment = "The F-Chat Horizon Client";
                categories = [ "Network" "Chat" "InstantMessaging" ];
                mimeTypes = [ "x-scheme-handler/fchat" ];
              })
            ];

            autoPatchelfIgnoreMissingDeps = true;
            ELECTRON_SKIP_BINARY_DOWNLOAD = "1";

            buildPhase = ''
              runHook preBuild
              autoPatchelf node_modules
              pnpm build:dist
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall

              mkdir -p $out/lib/horizon-electron
              mkdir -p $out/bin
              mkdir -p $out/share/icons/hicolor/256x256/apps
              mkdir -p $out/share/applications

              cp -r . $out/lib/horizon-electron/
              find . -name "icon.png" -exec cp {} $out/share/icons/hicolor/256x256/apps/horizon-electron.png \;


              cat << 'EOF' > $out/bin/horizon-electron
              #!/bin/sh

              export NODE_ENV=production
              export NIXOS_OZONE_WL=1

              exec ${electron}/bin/electron \
                "@OUT@/lib/horizon-electron/electron/app" \
                --ozone-platform=wayland \
                "$@"
              EOF

              runHook postInstall
            '';

            postFixup = ''
              substituteInPlace $out/bin/horizon-electron \
                --replace-fail "@OUT@" "$out"
              chmod +x $out/bin/horizon-electron
              substituteInPlace $out/share/applications/horizon-electron.desktop \
                --replace-fail "@out@" "$out" \
                --replace-fail "Icon=horizon-electron" "Icon=$out/share/icons/hicolor/256x256/apps/horizon-electron.png"
            '';
          };
          default = horizon-electron;
        };

        #The dev stuff, it's full of voodoo hoodoo and things I've not even tried. For my friends on the other side.
        devShells.default = pkgs.mkShell {
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
            echo "For packaging instructions, please see .github/CONTRIBUTING.md"
            echo ""
            echo "Double warning!!: Run 'patch_sass_embedded' after pnpm install to fix sass-embedded. It won't work in the Nix shell otherwise!!"
          '';
        };
      }
    );
}
