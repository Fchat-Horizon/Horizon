{
  description = "Nix flakes for both devs and users";

  inputs = {
    # why is NixPKGS stable only on Electron 33 as of writing?? (2026-01-06)
    # Electron moved up to 41.7.1 in stable If that matters
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
        #This is the version I think most users will be using. Since it builds normally
        packages.default = pkgs.stdenv.mkDerivation rec {
          pname = "fchat-horizon";
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

          buildInputs = [
            pkgs.stdenv.cc.cc.lib
            pkgs.libsecret
            pkgs.glib
          ];

          desktopItems = [
            (pkgs.makeDesktopItem {
              name = "fchat-horizon";
              exec = "@out@/bin/fchat-horizon %U";
              icon = "fchat-horizon";
              desktopName = "Fchat Horizon";
              comment = "F-chat desktop client";
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

            mkdir -p $out/lib/fchat-horizon
            mkdir -p $out/bin
            mkdir -p $out/share/icons/hicolor/256x256/apps
            mkdir -p $out/share/applications

            cp -r . $out/lib/fchat-horizon/
#I don't know if this part is actually needed. I just remember the app image didn't have an icon last time I tried. But I changed some other stuff locally, so I don't know either way TBH
            find . -name "icon.png" -exec cp {} $out/share/icons/hicolor/256x256/apps/horizon-electron.png \;

            cat << 'EOF' > $out/bin/fchat-horizon
            #!/bin/sh

            PASSWORD_STORE="detect"
#This might be a bit unusual, but it works.
            if pgrep -f "gnome-keyring-daemon" >/dev/null 2>&1 || pgrep -f "keepassxc" >/dev/null 2>&1 || [ -n "$GNOME_KEYRING_CONTROL" ]; then
              PASSWORD_STORE="gnome-libsecret"
            elif pgrep -f "kwallet" >/dev/null 2>&1; then
              PASSWORD_STORE="kwallet"
            fi

            export NODE_ENV=production
            export NIXOS_OZONE_WL=1

            exec ${electron}/bin/electron \
              "@OUT@/lib/fchat-horizon/electron/app" \
              --ozone-platform=wayland \
              --password-store="$PASSWORD_STORE" \
              "$@"
            EOF

            runHook postInstall
          '';

          postFixup = ''
            substituteInPlace $out/bin/fchat-horizon \
              --replace-fail "@OUT@" "$out"
            chmod +x $out/bin/fchat-horizon
            cp $out/lib/fchat-horizon/electron/build/horizon.desktop $out/share/applications/fchat-horizon.desktop
            substituteInPlace $out/share/applications/fchat-horizon.desktop \
              --replace-fail "/opt/horizon/horizon-electron" "$out/bin/fchat-horizon"
          '';






        };

        # I'm leaving this here for dev shell reasons.
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
            echo "For packaging instructions, please see CONTRIBUTING.md"
            echo ""
            echo "Double warning!!: Run 'patch_sass_embedded' after pnpm install to fix sass-embedded. It won't work in the Nix shell otherwise!!"
          '';
        };
      }
    );
}
