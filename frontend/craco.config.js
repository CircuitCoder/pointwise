const path = require('path');

module.exports = {
  webpack: {
    configure: orig => {
      const wasmExt = /\.wasm$/;
      const glslExt = /\.glsl$/;

      orig.resolve.extensions.push('.wasm');
      orig.module.rules.forEach(rule => {
        (rule.oneOf || []).forEach(oneOf => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            oneOf.exclude.push(wasmExt);
            oneOf.exclude.push(glslExt);
          }
        });
      });

      // Add a dedicated loader for WASM
      orig.module.rules.push({
        test: wasmExt,
        include: path.resolve(__dirname, 'src'),
        use: [{ loader: 'wasm-loader', options: {} }]
      });

      orig.module.rules.push({
        test: glslExt,
        include: path.resolve(__dirname, 'src'),
        use: [{ loader: 'raw-loader', options: {} }]
      });

      return orig;
    }
  }
};