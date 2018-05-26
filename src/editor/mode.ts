import "codemirror/lib/codemirror";
import * as util from "../util/util";

import { mathFormat, mathSplit } from "../editor/math";


import * as CodeMirror from "codemirror";
import { Z_STREAM_END } from "zlib";

import * as styles from "../util/styles";


// TODO: Wenn man die Seite im Hintergrund neulädt, ist CodeMirror nicht aktuell! z.B. sind die Auswahlzeilen teilweise falsch!
// TODO: Wenn man vor Liste navigiert, Cursor so navigieren, dass er nicht in der Spaces-sektion ist, sondern danach
// TODO: Fold!

/*
There are different categories of things to detect.

1) Widgets
    Text between $s or `s which starts at the very first char of a line and for itself contains line breaks or the line is empty after it
    If there is content after a multilined widget, it is silently droped
    ` is followed by the language and an optional title for the algorithm-box
    ![title](url) is handled similar
2) Structure
    structures the document as "title", "part", "paragraph"
    initiated by multiple #s followed by space
    the number of #s determines the text-size
3) Lists / Quotes
    like letter) number) romannumber) number. - * > or space, if the previous line is part of a list with equal or larger indentation
    lists and quotes are automatically continued but might be customized and changed ad libitum
    a lists level is determined by its indentation 
    a level ends when there is a less indented line. A paragraph break will end the list environment.
4) Paragraphs
    single break: same paragraph
    double break: next paragraph
5) Decoration
        * bold
        _ italic
        $ katex
        ~ strike
        % small caps
        ` src
    NOT markdown
    opening ignored, if followed by punctuation or space
    every symbol toggles the mode, e.g. *a = *a* = *a*** != **a** = a
6) Objects
    [], qed, QED... at the lineending will be aligned right
    ![title](url) is an media object
    [text](url) is a link
    -- is a en-dash
    #Name, @Name is a reference to the same page with this hash, e.g. #help has href="http://example.com/difos#help"

*/

const mathSizes: Array<string> = [];

let rxs: any = {}; // Regexp-Cache

CodeMirror.defineMode("difosMode", (config, modeConfig) => {
    return {
    startState: () => {
        return {
            header: 0,  // > 0 means this is a header-line

            bold: false,
            italic: false,
            math: false,
            strike: false,
            caps: false,
            src: false,

            widget: false,
            
            inlist: false,
            listtype: "",

            progress: 0,
            media: false,
            link: false,
        };
    },
    copyState: (s) => {
        return util.deepCopy(s);
    },
    blankLine: function (s) {

        return null;
    },
    token: function (stream, s) {

        // Reset Formatting
        if(stream.sol()) {
            s.bold = s.italic = s.strike = s.caps = false;
            if(!s.widget) s.math = s.src = false;
        }
        
        //////////////////////////////////////////////////
        // 1) Widgets
        
        if(stream.sol() && !s.widget) { // Begin Widget
            if(stream.match(/\$[^\$\\]*(?:\\.[^\$\\]*)*\$\s*$/i, false)) {
                stream.match("$");
                s.widget = true;
                s.math = true;
                s.progress = 1;
                return "control";               
            } else if(stream.match(/`\s*$/i)) {
                s.widget = true;
                s.src = true;
                s.progress = 3;
                return "control src-open";                
            } else if(!stream.match(/`[^`\\]*(?:\\.[^`\\]*)*`\s*\S+/i, false) && stream.match(/`\s*/i)) { // If the closing ` is on the same line, there must follow only whitespace.
                s.widget = true;
                s.src = true;
                s.progress = 1;
                return "control src-open";                
            } else if(stream.match(rxs.imgwidget || (rxs.imgwidget = new RegExp(`\\!\\[[^\\[\\]]*\\]\\s*\\(\\s*(${util.regexUrl})\\s*\\)\\s*$`, 'i')), false)) {  
                s.widget = true; 
                s.media = true;
                s.progress = 1;
                stream.match(/\!\[/i);
                return "control";
            }

        } else if(s.widget) {
            if(s.math) {
                s.progress++;
                switch(s.progress - 1) {
                    case 1: stream.match(/[^\$\\]*(?:\\.[^\$\\]*)*/i); return "math";
                    case 2: stream.match(/\$/i); s.progress = 0; s.widget = false; s.math = false; return "control";
                }
            } else if(s.src) {
                s.progress++;
                switch(s.progress - 1) {
                    case 1: 
                        if(stream.match(/\w+\s*$/i)) {
                            s.progress++;
                            return "control src-language";
                        } else if(stream.match(/\w+\s*/i)) {
                            return "control src-language";
                        } else {
                            console.error("Error 10");
                        }
                    case 2: stream.match(/[^`\\]*(?:\\.[^`\\]*)*/i); return "src-title";
                    case 3: 
                        if(stream.match(/`.*/i)) {
                            s.progress = 0; 
                            s.widget = false; 
                            s.src = false; 
                            return "control src-close";
                        } else if(stream.match(/[^`\\]*(?:\\.[^`\\]*)*\\?/i)) {
                            s.progress--;
                            return "src";
                        } else {
                            console.error("Error 9");
                        }
                }
            } else if(s.media) {
                s.progress++;
                switch(s.progress - 1) {
                    case 1: stream.match(/[^\]]*/i); return "media-title";
                    case 2: stream.match(/]\s*\(\s*/i); return "control";
                    case 3: stream.match((rxs.url || (rxs.url = new RegExp(util.regexUrl, 'i')))); return "control url";
                    case 4: stream.match(/\s*\)\s*$/i); s.progress = 0; s.widget = false; s.media = false; return "control";
                }
            }
        }

        
        //////////////////////////////////////////////////
        // 2) Structure       

        if(stream.sol()) { // Begin header
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
        } else if(s.header > 0) { // Continue header
            let q = s.header;
            if(q > 3) q = 3; 
            s.header = 0;
            stream.skipToEnd();
            return "h"+q;
        }
        
        
        //////////////////////////////////////////////////
        // 3) List item / Quotes    


        let adds = ""; // Will be added to the token in 4) and later

        const getListtype = (consume) => {            
            let listtype = "";
            if(stream.match(/\s*\d+\)($|\s+)/i,consume) ) { // 1) 2) 3)
                listtype = "nump"; 
            } else if(stream.match(/\s*\d+\.($|\s+)/i,consume)) { // 1. 2. 3.
                listtype = "numd"; 
            } else if(stream.match(rxs.listtyperoman_p || (rxs.listtyperoman_p = new RegExp("\\s*" + util.regexRoman + "\\)($|\\s+)", 'i')),consume)) { // i) II) iii)
                listtype = "romp"; 
            } else if(stream.match(rxs.listtyperoman_d || (rxs.listtyperoman_d = new RegExp("\\s*" + util.regexRoman + "\\.($|\\s+)", 'i')),consume)) { // i. II. iii.
                listtype = "romd"; 
            } else if(stream.match(/\s*[a-z]\)($|\s+)/i,consume)) { // a) B) c) 
                listtype = "alpp"; 
            } else if(stream.match(/\s*[\w\d]+\)($|\s+)/i,consume)) { // a) 1) c) hallo) Aufgabe1)
                listtype = "worp"; 
            } else if(stream.match(/\s*\>($|\s+)/i,consume)) { // quote
                listtype = "quot"; 
            } else if(stream.match(/\s*\*($|\s+)/i,consume)) { // *
                listtype = "star"; 
            } else if(stream.match(/\s*\-($|\s+)/i,consume)) { // -
                listtype = "minu"; 
            } 
            return listtype;
        }

        if(stream.sol()) {
            s.listtype = getListtype(false);
                    
            let level = stream.indentation() - 1;
            let emptyLine = false;
            if(stream.match(/\s+$/, false)) {  // Empty lines need additional indentation and end the list environment
                level++;
                emptyLine = true;
            }
            if(level >= 0 && stream.match(/\s+/)) {
                if(!emptyLine) {
                    s.inlist = true;
                    s.progress = 1; 
                }
                return "list-space list-level" + level;
            } 
        } 
    
        if(s.inlist) {
            s.progress++;
            switch(s.progress - 1) {
                case 1:
                    if(s.listtype.length <= 0) {
                        adds += "list-extra-space0 "
                        s.progress = 0;
                        s.inlist = false;
                        s.listtype = "";
                    } else {
                        if(!stream.match(/\S+\s*/)) console.error("Error 10");
                        const w = util.getTextWidth(stream.current(), "17px Droid Sans"); // TODO: Get this string from sass...?
                        return "list  list-" + s.listtype + " list-extra-space"+w;
                    }
                case 2:
                    s.progress = 0;
                    s.inlist = false;
                    s.listtype = "";
                    if(stream.match(/\s+/)) return "list-space-after";
                    break;
            }
        }
        

        //////////////////////////////////////////////////
        // 4) Paragraphs
        
        

        //////////////////////////////////////////////////
        // 5) Decoration

        /*
        You can open pairs only, if the opening one is not followed by whitespace or punctuation.
        But you can close it anywhere (to keep the implementation simple. Just think *of *this example*.).
        Unpaired ones will also work (to keep the implementation simple. Just think of *` *` and *` `*.)
        */
        const pairMatcher = (s, prop, stream, symb) => {
            if(stream.peek() !== symb) return false; // Less Regexp == better performance (this was significant!)
            const e = rxs["escaped_"+symb] || (rxs["escaped_"+symb] = util.escapeRegExp(symb));
            
            if(!s[prop] && stream.match(symb+symb)) { // Double symbols aren't control chars
                return false;
            } else if(!s[prop] && stream.match(rxs["pairMatcher_"+e] || (rxs["pairMatcher_"+e] = new RegExp(e+"[^\\s" + util.escapeRegExp(styles.punctuation) + "]")), false)) {
                s[prop] = true;
                stream.match(symb);
                return true;
            } else if(s[prop] && stream.match(symb)) { 
                s[prop] = false;
                return true;
            }

            return false;
        };

        if(pairMatcher(s, "src", stream, "`")) return "control "+adds; // TODO: Escape \` and allow whitespace!
        if(s.src) { 
            if(s.src) adds += "isrc ";
            if(!stream.match(/[^\`]+/)) console.error("Error 11"); // TODO: Escape \`
            return adds;
        }

        if(pairMatcher(s, "math", stream, "$")) return "control "+adds; // TODO: Escape \$ and allow whitespace!
        if(s.math) { 
            if(s.math) adds += "imath ";
            if(!stream.match(/[^\$]+/)) console.error("Error 12"); // TODO: Escape \$
            return adds;
        }
       
        if(pairMatcher(s, "bold", stream, "*")) return "control "+adds;
        if(pairMatcher(s, "italic", stream, "_")) return "control "+adds;
        if(pairMatcher(s, "strike", stream, "~")) return "control "+adds;
        if(pairMatcher(s, "caps", stream, "%")) return "control "+adds;

        if(s.bold) adds += "bold ";
        if(s.italic) adds += "italic ";
        if(s.strike) adds += "strike ";
        if(s.caps) adds += "caps ";
        
        
        //////////////////////////////////////////////////
        // 6) Objects

        if(s.link || s.media) {
            s.progress++;
            switch(s.progress - 1) {
                case 1: stream.match(/[^\]]*/i); if(s.link) return "link-text"; else return "media-title";
                case 2: stream.match(/]\s*\(\s*/i); return "control";
                case 3: stream.match(rxs.url || (rxs.url = new RegExp(util.regexUrl, 'i'))); return "control url";
                case 4: stream.match(/\s*\)/i); s.progress = 0; s.link = false; s.media = false; return "control";
            }
        }

        if(stream.match(rxs.media || (rxs.media = new RegExp(`\\!\\[[^\\[\\]]*\\]\\s*\\(\\s*(${util.regexUrl})\\s*\\)`, 'i')), false)) {  
            s.media = true;
            s.progress = 1;
            stream.match(/\!\[/i);
            return "control " + adds;
        }
        if(stream.match(rxs.link || (rxs.link = new RegExp(`\\[[^\\[\\]]*\\]\\s*\\(\\s*(${util.regexUrl})\\s*\\)*`, 'i')), false)) {  
            s.link = true;
            s.progress = 1;
            stream.match(/\[/i);
            return "control " + adds;
        }

        if(stream.match(/\s\[\s?\]\s*$/)) { // TODO: $$ [] is very strange
            return "qed-box " + adds;
        }
        if(stream.match(/\sq\.?e\.?d\.?\s*$/i)) {
            return "qed " + adds;
        }
        if(stream.match(/ \-\- /)) {
            return "nut " + adds;
        }
        if(stream.match(/[@#]\w+\b/)) {
            return "reference " + adds;
        }

        if(stream.current().length === 0) stream.next(); // TODO: Don't read just one char! Read as much as possible for the sake of performance! )-:
        return adds;

    }
    };
}); 

