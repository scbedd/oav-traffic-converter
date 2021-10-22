# oav-traffic-converter

This little tool is intended to showcase what it would look like to transform a directory full of `azure-sdk test-proxy` recordings files into traffic files consumable by the `oav` tool.

Along the way, answer the questions:

1. Does it help, or hurt us to output our recordings in this new format?
2. If we were go to the converter route, how fast is it?
   1. At scale, we need to be able to consume and convert a large amount of recordings files. For context, `storage` has 1313 recordings at time of writing.

## Local Sample Invocation

```node
npm run build
node ./build/cli.js convert --directory <input-dir> --out <output-dir>
```

So for a local example...

```node
npm run build
node ./build/cli.js convert --directory ./input-example/ --out ./output-example/
```
