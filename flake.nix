{
  description = "Chatbot dev environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }: 
    let
      system = "x86_64-linux"; # change to aarch64-linux if on ARM
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          bun
          nodejs
          prisma
          prisma-engines
          openssl
        ];
        
        shellHook = ''
          export PATH="$PWD/node_modules/.bin:$PATH"
          echo "Ready to hack"
        '';
      };
    };
}
