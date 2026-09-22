{
  description = "NeoWatch Web — Next.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "neowatch-web";

          packages = with pkgs; [
            nodejs_22
            corepack
            git
            jq
          ];

          shellHook = ''
            echo ""
            echo "  neowatch-web  |  node $(node --version) | npm $(npm --version)"
            echo ""
            echo "  npm install        — install dependencies"
            echo "  npm run dev        — start dev server"
            echo "  npm run build      — production build"
            echo "  npm run lint       — lint"
            echo ""
          '';
        };
      }
    );
}
