# oav-traffic-converter

This little tool is intended to showcase what it would look like to transform a directory full of `azure-sdk test-proxy` recordings files into traffic files consumable by the `oav` tool.

## Sample Invocation

```node
npm run build
node .\build\cli.js convert --directory <target-directory>
```
