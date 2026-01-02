await Bun.$`rm -rf ./dist`

const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  external: [ "rxjs", "@microsoft/signalr" ]
})

if(!result.success) {
    console.error("Build error:");
    for(const message of result.logs) 
        console.error(message)
    process.exit(1)
}

console.log("tsc");
await Bun.$`bunx tsc`

console.log("Build completed successfully.");