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

    version: number;
    identifier: string; // URI
    // contentHash: string;
    title: string | IStringMap;
    description: string | IStringMap;
    created: string;
    modified?: string;
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

// export interface ICustomizationManifestSignature {
//     key: string;
//     value: string;
//     algorithm: string; // URI
// }

export interface ICustomizationManifestLinkPropertiesExtension {
    // showOnHomeSection?: boolean;
    // showDeletion?: boolean;
    // defaultProfile?: boolean;
    authenticate?: ICustomizationLink;
    // logo?: ICustomizationLink; // never used in thorium-desktop
}

export interface ICustomizationLink {

    // https://github.com/ajv-validator/ajv-formats/blob/4ca86d21bd07571a30178cbb3714133db6eada9a/src/formats.ts#L56
    // https://developer.mozilla.org/en-US/docs/Web/URI/Reference
    href: string; // relative file path in zip directory or http(s) link => not fully an URI

    rel?: string;
    type?: string;
    title?: string | IStringMap;
    language?: string; // bcp47
}

export const customizationManifestJsonSchemaMinimal = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thorium Profile Manifest Json Schema (minimal)",
  "type": "object",
  "required": [
    "version",
    "created",
    "identifier",
    "title",
    "description",
    "theme",
  ],
  "properties": {
    "version": {
      "type": "integer",
    },
    "identifier": {
      "type": "string",
      "format": "uri",
    },
    "created": {
      "type": "string",
    },
    "modified": {
      "type": "string",
    },
    "title": {
      "oneOf": [
        {
          "type": "string",
        },
        {
          "type": "object",
          "additionalProperties": {
            "type": "string",
          },
        },
      ],
    },
    "description": {
      "oneOf": [
        {
          "type": "string",
        },
        {
          "type": "object",
          "additionalProperties": {
            "type": "string",
          },
        },
      ],
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
      },
    },
    "publications": {
      "type": "array",
      "items": {
        "type": "object",
      },
    },
    "images": {
      "type": "array",
      "items": {
        "type": "object",
      },
    },
  },
  "definitions": {
    "ICustomizationManifestThemeColor": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Theme color",
      "type": "object",
      "properties": {
        "neutral": {
          "type": "string",
        },
        "primary": {
          "type": "string",
        },
        "secondary": {
          "type": "string",
        },
        "border": {
          "type": "string",
        },
        "background": {
          "type": "string",
        },
        "appName": {
          "type": "string",
        },
        "scrollbarThumb": {
          "type": "string",
        },
        "buttonsBorder": {
          "type": "string",
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

    const valid = ajv.validate(customizationManifestJsonSchemaMinimal, data);

    __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}

export const __DEFAULT_MANIFEST_TEMPLATE = (): ICustomizationManifest => ({
  "version": 1,
  "created": (new Date()).toISOString(),
  "identifier": "thorium-manifest://com.example.your-extension",
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
        "buttonsBorder": "#000000",
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
});