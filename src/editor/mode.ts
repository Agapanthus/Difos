// CodeMirror, copyright (c) by laobubu
// Distributed under an MIT license: http://codemirror.net/LICENSE
//
// This is a patch to GFM mode. Supports:
// 1. footnote: style "hmd-footnote"
// 2. bare link: e.g. "please visit [page1] to continue", forwarding to footnote named as "page1"
//


import "codemirror/lib/codemirror";
import * as util from "../util/util";

import { mathFormat, mathSplit } from "../editor/math";


import * as CodeMirror from "codemirror";
import { Z_STREAM_END } from "zlib";



const imathSizes: Array<string> = [];

CodeMirror.defineMode("difosMode", (config, modeConfig) => {
    return {
    startState: () => {
        return {
            header: 0,  // > 0 means this is a header-line
            format: [], // Formatings applied to this line
            inlineWidgetCount: 0,
        };
    },
    copyState: (s) => {
        return util.deepCopy(s);
    },
    blankLine: function (s) {
        s.header = 0;
        
        return "hide";
    },
    token: function (stream, s) {

        if(s.header > 0) {
            let q = s.header;
            if(q > 3) q = 3; 
            s.header = 0;
            stream.skipToEnd();
            return "h"+q;
        }


        //////////////////////////////////////////////// Next
        
        ////////////// Headers
        if (stream.match(/###+\s+[^\s#]/, false) ) {
            s.header = 3;
            stream.eatWhile("#");
            stream.eatSpace();
            return "control";
        } else if (stream.match(/##\s+[^\s#]/, false) ) {
            s.header = 2;
            stream.eatWhile("#");
            stream.eatSpace();
            return "control";
        } else if (stream.match(/#\s+[^\s#]/, false) ) {
            s.header = 1;
            stream.eatWhile("#");
            stream.eatSpace();
            return "control";
        }

        ///////////// src

        if(stream.match("```")) {
            const i = s.format.indexOf("src");
            if(i >= 0) {
                s.format.splice(i,1);
            } else {
                //s.format.push("src");
                s.format = ["src"]; // quasi linebreak - löscht Formatierung
            }
            return "control";
        } 
        
        if(s.format.indexOf("src") >= 0) {
            stream.skipToEnd();
            if(stream.current().length <= 0) {
                console.error("Error 9")
            } else {                
                return "src";
            }
        }

        
        ///////////// isrc

        if(stream.match("`")) {
            const i = s.format.indexOf("isrc");
            if(i >= 0) {
                s.format.splice(i,1);
            } else {
                s.format.push("isrc");
            }
            return "control";
        }
    
        if(s.format.indexOf("isrc") >= 0) {
            if(stream.match(/[^`]+/)) {
                return s.format.join(" ");
            }
        }

        //////////// math

        if(stream.match("$$")) {
            const i = s.format.indexOf("math");
            if(i >= 0) {
                s.format.splice(i,1);
            } else {
                //s.format.push("math");
                s.format = ["math"]; // quasi linebreak - löscht Formatierung
                return "control math-open";
            }
            return "control";
        }
            
        if(stream.match("$")) {
            const i = s.format.indexOf("imath");
            if(i >= 0) {
                s.format.splice(i,1);
            } else {
                s.format.push("imath");
                return "control imath-open";

            }
            return "control";
        } 


        ////////////// Andere

        
       // console.log(stream.peek());
      //  console.log(s.format);

        if(s.format.indexOf("math") < 0 && s.format.indexOf("imath") < 0) {


            if(stream.sol()) { // Reset formating on linebreak
                s.format = [];
            }

            if(stream.match("**")) {
                const i = s.format.indexOf("bold");
                if(i >= 0) {
                    s.format.splice(i,1);
                } else {
                    s.format.push("bold");
                }
                return "control";
            }
            if(stream.match("__")) {
                const i = s.format.indexOf("italic");
                if(i >= 0) {
                    s.format.splice(i,1);
                } else {
                    s.format.push("italic");
                }
                return "control";
            }
            if(stream.match("%%")) {
                const i = s.format.indexOf("capi");
                if(i >= 0) {
                    s.format.splice(i,1);
                } else {
                    s.format.push("capi");
                }
                return "control";
            }
        }
        
        //stream.next();

        let adds = " ";
        

        if(s.format.indexOf("imath") >= 0 || s.format.indexOf("math") >= 0) {
        
            if(!util.defined((stream as any).lineOracle)) console.error("Error 8");
            const line = (stream as any).lineOracle.line;
            const ch = stream.pos + 1;

            if(!stream.match(/[^$]+/)) {
                stream.next();                
                console.error("Error 1!");
            }
            
            const x = mathSplit(stream.current());
            if(x[0] >= 0 && x[1] >= 0) {
                const xstr = x[0]+"x"+x[1];
                if(imathSizes.indexOf(xstr) < 0) {
                    imathSizes.push(xstr);
                    util.createCSSSelector(".cm-span"+xstr, "padding-right:"+x[0]+"px;line-height:"+x[1]+"px");
                }
                adds += "span"+xstr;
            }

            adds += " inlwid" + s.inlineWidgetCount + "x" + line + "x" + ch + " wid" + s.inlineWidgetCount;
            s.inlineWidgetCount++;

        }
        else {
            if(!stream.match(/[^*$_%#`]+/)) {
                stream.next();
                //console.error("Error 2!");
            }


            //while(stream.match(/[^*$_%#`]/));        
        }
        
        if(s.format.length > 0) {
            return s.format.join(" ") + adds;
        } else {
            return "default-text" + adds;
        }
    }
    };
}); 

//CodeMirror.defineMIME("text/x-hypermd", "hypermd");