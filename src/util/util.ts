import * as base64js from "base64-js";
import { TextDecoderLite, TextEncoderLite } from "./textencoderlite";
import * as $ from "jquery";


export function defined(variable: any) {
    return !(typeof variable === 'undefined');
}

// Base64 mit Unicode!!!
export function Base64Encode(str, encoding = 'utf-8') {
    var bytes = new TextEncoderLite().encode(str);        
    return base64js.fromByteArray(bytes);
}

export function Base64Decode(str, encoding = 'utf-8') {
    var bytes = base64js.toByteArray(str);
    return new TextDecoderLite().decode(bytes);
}

/*
// complement(a,b) are just those events from b which are not in a. Assumes a < b.
export function complement(a$, b$) {
    b$.map(_ => )
}
*/

export function updateState<T>(state: T, changes: Object) {
    if(!defined(state)) console.error("ERROR: updateState. State was undefined");
    let changed = false;
    for (let change in changes) {
        if(state[change] === changes[change]) continue;
        state[change] = changes[change];
        changed = true;
    }
    if(changed) return $.extend({}, state); // Damit die Änderung erkannt wird, muss man das Objekt kopieren... Keine Ahnung, wieso. Liegt an Onionify.
    return state;    
}



// https://stackoverflow.com/a/8630641/6144727
export function createCSSSelector(selector: string, style: string) {
    if (!document.styleSheets) return;
    if (document.getElementsByTagName('head').length == 0) return;

    let styleSheet;
    let mediaType;

    if (document.styleSheets.length > 0) {
        for (let i = 0, l = document.styleSheets.length; i < l; i++) {
            if (document.styleSheets[i].disabled)
                continue;
            const media = document.styleSheets[i].media;
            mediaType = typeof media;

            if (mediaType === 'string') {
                if ((media as any) === '' || ((media as any).indexOf('screen') !== -1)) {
                    styleSheet = document.styleSheets[i];
                }
            } else if (mediaType == 'object') {
                if (media.mediaText === '' || (media.mediaText.indexOf('screen') !== -1)) {
                    styleSheet = document.styleSheets[i];
                }
            }

            if (typeof styleSheet !== 'undefined')
                break;
        }
    }

    if (typeof styleSheet === 'undefined') {
        var styleSheetElement = document.createElement('style');
        styleSheetElement.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(styleSheetElement);

        for (i = 0; i < document.styleSheets.length; i++) {
            if (document.styleSheets[i].disabled) {
                continue;
            }
            styleSheet = document.styleSheets[i];
        }

        mediaType = typeof styleSheet.media;
    }

    if (mediaType === 'string') {
        for (var i = 0, l = styleSheet.rules.length; i < l; i++) {
            if (styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                styleSheet.rules[i].style.cssText = style;
                return;
            }
        }
        styleSheet.addRule(selector, style);
    } else if (mediaType === 'object') {
        var styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;
        for (var i = 0; i < styleSheetLength; i++) {
            if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                styleSheet.cssRules[i].style.cssText = style;
                return;
            }
        }
        styleSheet.insertRule(selector + '{' + style + '}', styleSheetLength);
    }
}

export function hasElement(needle: any, haystack: any[]): boolean {
    return (haystack.indexOf(needle) > -1);
}

export function filter(a2: Array<any>, callback: Function, context?: any) {
    let arr = [];
    for (var i = 0; i < a2.length; i++) {
        if (callback.call(context, a2[i], i, a2))
            arr.push(a2[i]);
    }
    return arr;
};

export function startsWith(str: string, prefix: string): boolean {
    return str.indexOf(prefix) === 0;
}
export function endsWith(str: string, suffix: string): boolean {
    const matches = str.match(suffix+"$");
    if(!matches) return false;
    return matches[0] === suffix;
}

export function deepCopy(a: Object): Object {
    return jQuery.extend(true, {}, a);
}