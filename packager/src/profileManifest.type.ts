// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IStringMap {
    [key: string]: string;
}

export type AnyJson = JsonPrimitives | JsonArray | JsonMap;
export type JsonPrimitives = string | number | boolean | null;
export interface JsonMap {
    [key: string]: AnyJson;
}
export interface JsonArray extends Array<AnyJson> {
}


// https://www.notion.so/edrlab/Thorium-Reader-Profiles-1d8a1ca5712f80619738c2f26e700355

export interface IProfileManifest {

    /**
     * An integer specifying the version of the manifest file format that your profile uses
     */
    version: number;

    /**
     * Unique package identifier, independent from its version
     */
    identifier: string; // URI

    /**
     * The date and time of creation of the manifest content.
     */
    created: string; // ISO 8601 datetime // https://datatracker.ietf.org/doc/html/rfc3339#section-5.6

    /**
     * The date and time of last modification of the manifest content.
     */
    modified?: string; // ISO 8601 datetime // https://datatracker.ietf.org/doc/html/rfc3339#section-5.6

    /**
     * Profile title
     */
    title: string | IStringMap;

    /**
     * Profile description
     */
    description: string | IStringMap;

    /**
     * sha256 iteration of all crc32 in the zip directory, manifest.json excluded
     */
    contentHash: string;
    
    /**
     * Theme description
     */
    theme: IProfileManifestTheme;
    
    /**
     * Package links with specific rel to be defined, links can be either relative (FS) or absolute (HTTP) and depend on the value of rel
     */
    links: Array<JsonArray & { properties: IProfileManifestLinkPropertiesExtension }>;
    
    /**
     * Images in the package specified with a rel value (e.g. logo of the profile). Image links are relative to the zip directory.  
    */
    images: JsonArray;
    
    /**
     * OPDSPublications
     */
    publications?: JsonArray; // OPDSPublication;

    /**
     * package manifest signature
     */
    signature: IProfileManifestSignature;
}

export interface IProfileManifestTheme {

    color: {
        dark: IProfileManifestColor;
        light: IProfileManifestColor;
    }
}

export interface IProfileManifestColor {
    neutral: string;
    primary: string;
    secondary: string;
    border: string;
    background: string;
    appName: string;
    scrollbarThumb: string;
    buttonsBorder: string;
}

export interface IProfileManifestSignature {
    key: string;
    value: string;
    algorithm: string; // URI
}

export interface IProfileManifestLinkPropertiesExtension {
    // showOnHomeSection?: boolean;
    authenticate?: IProfileLink;
    logo?: IProfileLink;
}

export interface IProfileLink {
    href: string;
    type?: string;
    rel?: string;
    title?: string | IStringMap;
    language?: string;
}