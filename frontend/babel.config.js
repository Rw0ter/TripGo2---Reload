module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // unstable_transformImportMeta：转译 import.meta，否则 web 端
      // 浏览器报 "Cannot use 'import.meta' outside a module"。
      [
        'babel-preset-expo',
        { jsxImportSource: 'nativewind', unstable_transformImportMeta: true },
      ],
      'nativewind/babel',
    ],
  };
};
