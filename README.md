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
node ./build/cli.js convert --directory <input-dir> --out <output-dir> --api-version <api-version-string>
```

The `api-version-string` is a stop gap, given that this will be a bit more complicated than a single value per test run. Our tests may actually exercise different api-versions intentionally. The real answer is to patch `oav` to pull the `api-version` from the header values.

So for a local example...

```node
npm run build
node ./build/cli.js convert --directory ./input-example/ --out ./output-example/
```

Or for a much bigger sample, use the `tables storage tests` present in `sample-tables-input/`.

```node
npm run build
node ./build/cli.js convert --directory ./input-example/ --out ./output-example/
```

Time a run...

```powershell
# on windows
measure-command { node .\build\cli.js convert --directory C:/repo/oav-traffic-converter/input-example/ --out ./output-example/ | out-host }
```

```sh
# on linux
time node ./build/cli.js convert --directory ./input-example/ --out ./output-example/
```

Cleanup a sample run...

```powershell
Get-ChildItem .\output-example\ -Filter *.json | ? { !$_.Name.Contains("output-example.json") -and !$_.Name.Contains("test_retry.pyTestStorageRetrytest_retry_on_server_error0.json") } | % { Remove-Item $_ }
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
```

Repeated for each `entry` in the `Entries` array in the input value. This means that one `Proxy` recording can generate from 1 to N `ValidationPayload`s.

Couple Specificities:

1. oav expects the request body to be valid json. This is definitely not always the case, as some `javascript` libraries definitely fire text-based request bodies (versus json).
2. There are no "integer" entries, all primitives are string, even if it's valid to have a number value.
3. Ray Chen manually cleaned out the UTF8 encoded bodies. We are parsing as `utf8` before writing the files, so this is just naturally being taken care of by our converter.
4. The `url` attribute MUST have an additional argument of `api-version=blah`.

## Recommendations going forward

The converter performed adequately enough to not put a huge wrench in the process if we want to run this live.

| Benchmark | Time (on windows) |
|---|---|
| 1 file | Instant |
| 536 files (python tables recorded tests) | ~1 second (900ms to 1422ms) |
| 1300 files (.NET blob recorded tests) | ~5 seconds (4000ms to 5700ms) |

### Discovered Issues

This tool has been run against the python `tables` tests successfully.

* Also tested against all `azure.storage.blobs` SessionRecordings, ran into a `too many open files` error, but was quite effective otherwise.
* The request URLS _must_ have an API Version in them. This necessitates conversion of the recording until `oav` is patched.

`Too many open files` is caused by the fact that we're just opening all the threads at once. We just gotta find an efficient way to batch without removing the performance characteristics of the current solution.
