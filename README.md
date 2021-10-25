# oav-traffic-converter

This little tool is intended to showcase what it would look like to transform a directory full of [`azure-sdk test-proxy`](https://github.com/Azure/azure-sdk-tools/tree/main/tools/test-proxy/Azure.Sdk.Tools.TestProxy) recordings files into traffic files consumable by the `oav` tool.

Along the way, answer the questions:

1. Does it help, or hurt us to output our recordings in this new format?
2. If we were go to the converter route, how fast is it?
   1. At scale, we need to be able to consume and convert a large amount of recordings files. For context, `python storage` has 1313 recordings at time of writing.

All discussions WRT compatibility with [`oav` ](https://github.com/Azure/oav/) should be in context of the **live validation mode**.

**This converter does not handle non-json files. It 100% assumes valid json input.**

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

## Learnings

The current output format of the test-proxy is fairly close to what oav requires.

```json
{
  "Entries": [
    {
      "RequestUri": "",
      "RequestMethod": "POST",
      "RequestHeaders": {},
      "RequestBody": "{}",
      "StatusCode": 201,
      "ResponseHeaders": {},
      "ResponseBody": {} 
    }
  ]
}
```

needs to convert to

```json
{
  "liveRequest": {
    "body": {},
    "method": "",
    "url": "",
    "headers": {}
  },
  "liveResponse": {
    "body": {},
    "statusCode": "201",
    "headers": {}
  }
}
// ...multiplied by number of request/response entries in the original recording.
```

Repeated for each `entry` in the `Entries` array in the input value.

Couple Specificities:

1. oav expects the request body to be valid json. This is definitely not always the case, as some `javascript` libraries definitely fire text-based request bodies (versus json).
2. There are no "integer" entries, everything is json even if it's valid to have a number.
3. Ray Chen manually cleaned out the UTF8 encoded bodies. We are parsing as `utf8` before writing the files, so I think this problem is actually just taken care of for us.

## Recommendations going forward

The converter performed adequately enough to not put a huge wrench in the process if we want to run this live.

| Benchmark | Time |
|---|---|
| 1 file |  |
| 536 files (python tables recorded tests) |  |
| 1300 files (.NET blob recorded tests) |  |

Discovered Issues

* Everything is a string, regardless of what the source type really is. EG: `StatusCode`.
* Payload bodies seemingly must be in JSON. The AZSDK has a lot more than just json payloads, so this is obviously something `scbedd` is missing.
