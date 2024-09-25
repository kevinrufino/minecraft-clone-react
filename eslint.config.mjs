import globals from "globals";
import pluginReact from "eslint-plugin-react";

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginReact.configs.flat.recommended,
];
