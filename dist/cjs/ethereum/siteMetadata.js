"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cross_inpage_provider_types_1 = require("@chargerwallet/cross-inpage-provider-types");
const messages_1 = __importDefault(require("./messages"));
/**
 * Sends site metadata over an RPC request.
 *
 * @param engine - The JSON RPC Engine to send metadata over.
 * @param log - The logging API to use.
 */
function sendSiteMetadata(engine, log) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const domainMetadata = yield getSiteMetadata();
            // call engine.handle directly to avoid normal RPC request handling
            void engine.request({
                scope: cross_inpage_provider_types_1.IInjectedProviderNames.ethereum,
                data: {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'metamask_sendDomainMetadata',
                    params: domainMetadata,
                },
            });
        }
        catch (error) {
            log.error({
                message: messages_1.default.errors.sendSiteMetadata(),
                originalError: error,
            });
        }
    });
}
exports.default = sendSiteMetadata;
/**
 * Gets site metadata and returns it
 *
 */
function getSiteMetadata() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            name: getSiteName(window),
            icon: yield getSiteIcon(window),
        };
    });
}
/**
 * Extracts a name for the site from the DOM
 */
function getSiteName(windowObject) {
    const { document } = windowObject;
    const siteName = document.querySelector('head > meta[property="og:site_name"]');
    if (siteName) {
        return siteName.content;
    }
    const metaTitle = document.querySelector('head > meta[name="title"]');
    if (metaTitle) {
        return metaTitle.content;
    }
    if (document.title && document.title.length > 0) {
        return document.title;
    }
    return window.location.hostname;
}
/**
 * Extracts an icon for the site from the DOM
 * @returns an icon URL
 */
function getSiteIcon(windowObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const { document } = windowObject;
        const icons = document.querySelectorAll('head > link[rel~="icon"]');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const iconsArr = icons;
        for (const icon of iconsArr) {
            if (icon && (yield imgExists(icon.href))) {
                return icon.href;
            }
        }
        return null;
    });
}
/**
 * Returns whether the given image URL exists
 * @param url - the url of the image
 * @returns Whether the image exists.
 */
function imgExists(url) {
    return new Promise((resolve, reject) => {
        try {
            const img = document.createElement('img');
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        }
        catch (e) {
            reject(e);
        }
    });
}
