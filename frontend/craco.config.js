const path = require('path');

module.exports = {
  webpack: {
    configure: orig => {
      const wasmExtensionRegExp = /\.wasm$/;
      orig.resolve.extensions.push('.wasm');
      orig.module.rules.forEach(rule => {
        (rule.oneOf || []).forEach(oneOf => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      // Add a dedicated loader for WASM
      orig.module.rules.push({
        test: wasmExtensionRegExp,
        include: path.resolve(__dirname, 'src'),
        use: [{ loader: 'wasm-loader', options: {} }]
      });

      return orig;
    }
  }
};