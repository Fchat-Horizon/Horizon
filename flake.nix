{
  description = "Nix flakes for both devs and users";

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

        makeHorizon = { isDev ? false }: pkgs.stdenv.mkDerivation rec {
          pname = if isDev then "horizon-electron-dev" else "horizon-electron";
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
              name = pname;
              exec = "@out@/bin/${pname} %U";
              icon = pname;
              desktopName = if isDev then "Horizon Dev" else "Horizon";
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
            ${if isDev then "pnpm build" else "pnpm build:dist"}
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            mkdir -p $out/lib/${pname}
            mkdir -p $out/bin
            mkdir -p $out/share/icons/hicolor/256x256/apps
            mkdir -p $out/share/applications

            cp -r . $out/lib/${pname}/
            find . -name "icon.png" -exec cp {} $out/share/icons/hicolor/256x256/apps/${pname}.png \;

            cat << 'EOF' > $out/bin/${pname}
            #!/bin/sh

            export NODE_ENV=${if isDev then "development" else "production"}
            export NIXOS_OZONE_WL=1

            exec ${electron}/bin/electron \
              "@OUT@/lib/${pname}/electron/app" \
              --ozone-platform=wayland \
              "$@"
            EOF

            runHook postInstall
          '';

          postFixup = ''
            substituteInPlace $out/bin/${pname} \
              --replace-fail "@OUT@" "$out"
            chmod +x $out/bin/${pname}
            substituteInPlace $out/share/applications/${pname}.desktop \
              --replace-fail "@out@" "$out" \
              --replace-fail "Icon=${pname}" "Icon=$out/share/icons/hicolor/256x256/apps/${pname}.png"
          '';
        };
      in
      {

        #horizon-electron for the end user
        #horizon-electron-dev for the devs.
        packages = rec {
          horizon-electron = makeHorizon { isDev = false; };
          horizon-electron-dev = makeHorizon { isDev = true; };
          default = horizon-electron;
        };


        # The dev version parts.
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
