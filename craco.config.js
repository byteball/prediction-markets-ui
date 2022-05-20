const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#2D72F6',
              '@border-radius-base': '8px',
              // '@text-color': '#333333',
              '@font-size-base': '16px'
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ]
};