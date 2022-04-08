# Live Slidev

Secure *Serverless* Slidev Presenter Mode

Create presentations that sync to an authorized client using cryptography.

**This extension syncs:**
- Drawings
- Navigation
- Dark Mode

## Installation

In your Slidev project:

```
yarn add live-slidev
```

To generate the boilerplate code:
```
yarn live-slidev
```

## Demo

- [Presenter mode](https://weisrc.github.io/live-slidev#WeHEBDagZzYKBFyGRVqPUdT64Jull3SGp60tTF4SrD3ZOaDWL8AnuJ_9ovtYUh7d)
- [Play mode](https://weisrc.github.io/live-slidev)

## Under the Hood

Live Slidev under the hood uses a public websocket server hosted on Deno, therefore, it will not handle any authorization logic. It will be handled by the client with the WebCrypto API.

To enter into presenter mode, the user must add a hash at the end of the url. If the content of the hash forms a valid Elliptical-Curve private key when combined with the public key, the client will go into Presenter Mode. Otherwise, an error in the console will be emitted. The hash will be the 'd' parameter of the key: it is the top secret parameter!

For demo purposes, this repo's secret is shared so you can test it!

## Drawbacks

- WebCrypto API requires a secure context. (Host it with GitHub Pages!)
- May have issues when multiple clients are trying to present.
- Fails to compile in Slidev Dev mode. (Rename main to something else when in Dev mode)