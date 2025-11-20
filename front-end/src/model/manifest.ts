// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/**
 * Extracted from Thorium-reader
 * https://github.com/edrlab/thorium-reader/blob/63fc4b62ab9c32229beb70c9794a208d3900b4b7/src/common/readium/customization/manifest.ts
 */


import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import addSemver from "ajv-semver";

// import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
export interface IStringMap { [key: string]: string; }

// import { JsonArray } from "readium-desktop/typings/json";
export type AnyJson = JsonPrimitives | JsonArray | JsonMap;
export type JsonPrimitives = string | number | boolean | null;
export interface JsonMap {
    [key: string]: AnyJson;
}
export interface JsonArray extends Array<AnyJson> {
}


// https://www.notion.so/edrlab/Thorium-Reader-Profiles-1d8a1ca5712f80619738c2f26e700355

export interface ICustomizationManifest {

    manifestVersion: number;
    identifier: string; // URI
    version: string; // semantic versionning
    // contentHash: string;
    title: IStringMap;
    description: IStringMap;
    // welcomeScreen: string; // replace with a link rel = "welcome-screen"
    // default_locale: string; // BCP47 // not used anymore but still in notion example manifest
    theme: ICustomizationManifestTheme;
    images: ICustomizationLink[];
    links?: Array<ICustomizationLink & { properties: ICustomizationManifestLinkPropertiesExtension }>;
    publications?: JsonArray; // OPDSPublication;
    // signature: ICustomizationManifestSignature | undefined;
}

export interface ICustomizationManifestTheme {

    color: {
        dark: ICustomizationManifestColor;
        light: ICustomizationManifestColor;
    }
}

export interface ICustomizationManifestColor {
    neutral: string;
    primary: string;
    secondary: string;
    border: string;
    background: string;
    appName: string;
    scrollbarThumb: string;
    buttonsBorder: string;
}

export interface ICustomizationManifestSignature {
    key: string;
    value: string;
    algorithm: string; // URI
}

export interface ICustomizationManifestLinkPropertiesExtension {
    showOnHomeSection?: boolean;
    // showDeletion?: boolean;
    // defaultProfile?: boolean;
    authenticate?: ICustomizationLink;
    logo?: ICustomizationLink;
}

export interface ICustomizationLink {
    href: string; // relative file path in zip directory or http(s) link => not fully an URI
    rel?: string;
    type?: string;
    title?: IStringMap;
    language?: string; // bcp47
}

export const customizationManifestJsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thorium Manifest Schema",
  "type": "object",
  "required": [
    "manifestVersion",
    "identifier",
    "version",
    // "contentHash",
    "title",
    "description",
    "theme",
    "images",
  ],
  "properties": {
    "manifestVersion": {
      "type": "integer",
    },
    "identifier": {
      "type": "string",
      "format": "uri",
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "format": "semver"
    },
    "contentHash": {
      "type": "string",
    },
    "title": {
      "$ref": "#/definitions/ICustomizationManifestIStringMap",
    },
    "description": {
      "$ref": "#/definitions/ICustomizationManifestIStringMap",
    },
    "theme": {
      "type": "object",
      "properties": {
        "color": {
          "type": "object",
          "properties": {
            "dark": {
              "$ref": "#/definitions/ICustomizationManifestThemeColor",
            },
            "light": {
              "$ref": "#/definitions/ICustomizationManifestThemeColor",
            },
          },
          "required": [
            "dark",
            "light",
          ],
        },
      },
      "required": [
        "color",
      ],
    },
    "links": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rel": {
            "type": "string"
          },
          "href": {
            "type": "string",
            "format": "uri-reference"
          },
          "type": {
            "type": "string"
          },
          "title": {
            "$ref": "#/definitions/ICustomizationManifestIStringMap",
          },
          "language": {
            "type": "string",
            "pattern": "^([A-Za-z]{2})(-[A-Za-z]{2})?$"
          },
          "properties": {
            "type": "object",
            "properties": {
              "authenticate": {
                "type": "object",
                "properties": {
                  "type": { "type": "string" },
                  "href": { "type": "string", "format": "uri" }
                },
                "required": ["type", "href"]
              },
              "logo": {
                "type": "object",
                "properties": {
                  "type": { "type": "string" },
                  "href": { "type": "string", "format": "uri-reference" }
                },
                "required": ["type", "href"]
              }
            },
          }
        },
        "required": ["rel", "href"]
      }
    },
    "publications": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "metadata",
          "links",
          "images",
        ],
        "properties": {
          "metadata": {
            "type": "object",
          },
          "links": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/ICustomizationManifestReducedLinks"
            }
          },
          "images": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/ICustomizationManifestReducedLinks"
            }
          }
        }
      },
    },
    "images": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/ICustomizationManifestReducedLinks"
      },
    },
  },
  "definitions": {
    "ICustomizationManifestReducedLinks": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Links",
      "type": "object",
      "properties": {
        "rel": {
          "type": "string"
        },
        "href": {
          "type": "string",
          "format": "uri-reference"
        },
        "type": {
          "type": "string"
        },
        "language": {
          "type": "string",
          "pattern": "^([A-Za-z]{2})(-[A-Za-z]{2})?$"
        }
      },
      "required": [
        "href",
      ],
    },
    "ICustomizationManifestIStringMap": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "IStringMap",
      "type": "object",
      "propertyNames": {
        "pattern": "^([A-Za-z]{2})(-[A-Za-z]{2})?$"
      },
      "additionalProperties": {
        "type": "string",
      },
      "minProperties": 1,
    },
    "ICustomizationManifestThemeColor": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Theme color",
      "type": "object",
      "properties": {
        "neutral": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "primary": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "secondary": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "border": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "background": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "appName": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "scrollbarThumb": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
        "buttonsBorder": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$"
        },
      },
      "required": [
        "neutral",
        "primary",
        "secondary",
        "border",
        "background",
        "appName",
        "scrollbarThumb",
        "buttonsBorder",
      ],
    },
  },
};


// TODO: do not let global variable
export let __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = "";
export function isCustomizationProfileManifest(data: any): data is ICustomizationManifest {

    const ajv = new Ajv();
    addFormats.default(ajv);
    // eslint-disable-next-line
    addSemver.default(ajv);

    const valid = ajv.validate(customizationManifestJsonSchema, data);

    __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}

export const __DEFAULT_MANIFEST_TEMPLATE: ICustomizationManifest= {
  "manifestVersion": 1,
  "identifier": "thorium-manifest://com.example.your-extension",
  "version": "1.0.0",
	"title": {
	  "en": "Sample profile title",
	},
  "description": {
	  "en": "Sample description",
	},
  "theme": {
    "color": {
      "dark": {
        "neutral": "#000000",
        "primary": "#000000",
        "secondary": "#000000",
        "border": "#000000",
        "background": "#000000",
        "appName": "#000000",
        "scrollbarThumb": "#000000",
        "buttonsBorder": "000000",
      },
      "light": {
        "neutral": "#000000",
        "primary": "#000000",
        "secondary": "#000000",
        "border": "#000000",
        "background": "#000000",
        "appName": "#000000",
        "scrollbarThumb": "#000000",
        "buttonsBorder": "#000000",
      }
    }
  },
  "links": [],
  "publications": [],
  "images": [],
};