import globals from "globals";
import pluginReact from "eslint-plugin-react";

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.worker } } },
  pluginReact.configs.flat.recommended,
  {
    settings: { react: { version: "detect" } },
    rules: {
      // new JSX transform -- no React import needed
      "react/react-in-jsx-scope": "off",
      // not using prop-types
      "react/prop-types": "off",
      // react-three-fiber uses non-DOM JSX properties (attach, args, ...)
      "react/no-unknown-property": "off",
    },
  },
];
