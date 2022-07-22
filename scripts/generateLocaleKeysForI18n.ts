import { readdir, readFile, writeFileSync } from "fs";
import chalk from "chalk";

import en from "../lang/en.json";

const LANG_DIR = "./lang";
let newJsonLangFile = {};
let missingJsonTranslations = {};
let isDeletedFromEn = false;

Promise.resolve(
  (() => {
    console.group(
      chalk.bgCyan.black(`Successfully added missing translations keys`)
    );
    function filterByKeys(toDiffArray: {}) {
      const filterByEn = Object.keys(en).filter(
        (keys) => !Object.keys(toDiffArray).includes(keys)
      );
      const filterByOther = Object.keys(toDiffArray).filter(
        (keys) => !Object.keys(en).includes(keys)
      );

      // When key is added to en.json, script is run and then key from
      // en.json is deleted
      if (filterByEn.length <= 0) {
        isDeletedFromEn = true;
        return filterByOther;
      }

      // When a new key is added
      if (filterByOther.length <= 0) {
        return filterByEn;
      }
    }

    readdir(`${LANG_DIR}`, (err, files) => {
      if (err) {
        throw new Error(`Cannot read JSON files inside ${LANG_DIR}`);
      }
      const filesWithoutEnIndex = files.indexOf(files[1]);

      if (filesWithoutEnIndex > -1) {
        files.splice(filesWithoutEnIndex, 1);
      }

      files.forEach((file) => {
        readFile(`${LANG_DIR}/${file}`, "utf8", async (err, data) => {
          if (err) {
            throw new Error(`Cannot read ${file} inside ${LANG_DIR}`);
          }
          let missingKeys: string[] = [];

          try {
            let currentJsonLangFile = await JSON.parse(data);

            missingKeys = filterByKeys(currentJsonLangFile);

            // If files matches don't do anything
            if (missingKeys.length <= 0) {
              return;
            }

            missingKeys.map((key) => {
              // if we add and then delete something from en.json
              if (isDeletedFromEn && currentJsonLangFile.hasOwnProperty(key)) {
                return delete currentJsonLangFile[key];
              }

              const currentMissingJsonKey = {
                [key]: {
                  defaultMessage: "",
                  description: en[key].description || "",
                },
              };
              missingJsonTranslations = {
                ...missingJsonTranslations,
                ...currentMissingJsonKey,
              };

              return missingJsonTranslations;
            });

            newJsonLangFile = {
              ...currentJsonLangFile,
              ...missingJsonTranslations,
            };

            writeFileSync(
              `${LANG_DIR}/${file}`,
              JSON.stringify(newJsonLangFile, null, 2),
              "utf-8"
            );
          } catch (error) {
            console.log(
              chalk.bgRedBright.whiteBright(
                "Something went wrong with adding missing keys to other locales..."
              )
            );
          }
        });
      });
    });
    console.groupEnd();
  })()
).catch((error) => {
  console.error(error);
  process.exit(1);
});
