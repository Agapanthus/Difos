// See http://codemirror.net/demo/closebrackets.html

import * as CodeMirror from "codemirror";
const Pos = CodeMirror.Pos;
import * as util from "../util/util";
import {
    CMEdit,
    InlineWidget,
    CMEditEx
} from "./iwids";
import * as styles from "../util/styles";

import * as CMH from "../../node_modules/codemirror/src/line/highlight.js";

// Calculates state based on the given state and code
function hypotheticalState(cm: CMEditEx, lines: Array < string > , firstStart: number, firstLine: number, istate: any) {
    const mode = cm.getDoc().getMode();

    // see codemirror/src/line/highlight.js
    const context = {
        state: mode.copyState(istate),
        line: firstLine,
        doc: cm.getDoc(),
        maxLookAhead: 0,
        baseTokens: null,
        baseTokenPos: 1
    };
    for (var i = 0; i < lines.length; ++i) {
        const line = lines[i];
        CMH.processLine(cm, line, context, (i === 0) ? firstStart : 0);
    }
    return context.state;
}


const sani_cm = (cm: CMEditEx, change: {
    from: CodeMirror.Position,
    to: CodeMirror.Position,
    origin: string,
    text: string[] ,
    update: (from: CodeMirror.Position, to: CodeMirror.Position, text: string[], origin: string) => void
}) => {
    //console.log(change);

    const getSym = f => {
        switch (f) {
            case "math":
                return "$";
            case "isrc":
                return "`";
            case "src":
                return "```";
            case "bold":
                return "**";
            case "italic":
                return "__";
            case "capi":
                return "%%";
            default:
                return "";
        }
    };
    const sensitiveSym = "$*`*_%"; // If a char is not one of these, it can safely be ignored when rendering formatting (except when used as separator)

    if (change.text.length == 1 && change.text[0] == "") { // Something deleted
        // Parse change + the last char before and the first after
        // if there is a paired symbol: Parse line
        // delete remove paired symbol symbol
    } else { // Something added

        // The idea:
        // Calculate the state after the insertion before and after the insertion and add control-characters so that state won't change after the insertion


        const doc = cm.getDoc();

        ///////// If there are control-characters after the insertion, we need to take care of them
        let sensEnding = "";
        const fl = doc.getLine(change.to.line);
        for (let i = change.to.ch; i < fl.length; i++) {
            if (sensitiveSym.indexOf(fl.charAt(i)) >= 0) {
                sensEnding += fl.charAt(i);
            } else break;
        }

        // The part before the insertion
        const firstpart = doc.getLine(change.from.line).substr(0, change.from.ch);

        // The changed part
        const changedPlus = util.deepCopy(change.text);
        changedPlus[0] = firstpart + changedPlus[0];
        changedPlus[changedPlus.length - 1] += " " + sensEnding; // TODO: Was tun mit sensEnding?

        // The unchanged part
        const beforePlus = [];
        for (let n = change.from.line + 1; n < change.to.line; n++) {
            beforePlus.push(doc.getLine(n));
        }
        beforePlus.push(doc.getLine(change.to.line).substr(0, change.to.ch + sensEnding.length));

        // Calculate start before the first line
        let firstState;
        if (change.from.line === 0) {
            firstState = cm.getDoc().getMode().startState();
        } else {
            firstState = (cm as any).getStateAfter(change.from.line - 1, true);
        }


        //const beforeState = hypotheticalState(cm, [firstpart], 0, change.from.line, firstState);
        //const beforeForm = beforeState.form as array<string>;


        const afterForm = hypotheticalState(cm, beforePlus, 0, change.from.line, firstState).format as string[];
        const afterChangedForm = hypotheticalState(cm, changedPlus, 0, change.from.line, firstState).format as string[];


        console.log("\n////////////////////////////");
        console.log(firstState.format)
        console.log(beforePlus);
        console.log(afterForm);
        console.log(changedPlus);
        console.log(afterChangedForm);


        let adds = "";
        // add formatting
        for (const f of afterChangedForm) {
            if (!util.hasElement(f, afterForm)) {
                adds += getSym(f) + " ";
            }
        }
        // remove formatting
        for (const f of afterForm) {
            if (!util.hasElement(f, afterChangedForm)) {
                adds += getSym(f) + " ";
            }
        }
        adds = adds.trim();


        // If there are control-chars at the end of the insertion, get them
        let sensStart = "";
        const lt = change.text[change.text.length - 1];
        for (let i = lt.length - 1; i >= 0; i--) {
            if (sensitiveSym.indexOf(lt[i]) >= 0) {
                sensStart = lt[i] + sensStart;
            } else break;
        }

        // Remove some unneccessary whitespaces
        adds = sensStart + " " + adds + " " + sensEnding;
        let spl = adds.split(new RegExp(`[^${util.escapeRegExp(sensitiveSym)}]`));
        adds = util.reduce(spl, (acc, val) => {
            if (acc.length > 0 && val.length > 0 && acc[acc.length - 1] === val[0]) return acc + " " + val;
            return acc + val;
        });
        adds = adds.substr(sensStart.length, adds.length - sensStart.length - sensEnding.length);


        // Update changes
        const updated = util.deepCopy(change.text);
        updated[updated.length - 1] = updated[updated.length - 1] + adds;
        if (adds.length > 0) {
            change.update(change.from, change.to, updated, change.origin);
        }
    }

};



CodeMirror.defineOption("autocomplete", {
    /*
    - if not before words, an opening one is closed
    - selections are surrounded
    - existing closing ones ore skipped
    */
    openpairs: "**__~~%%$$``[](){}\"\"\'\'", 

    /*
    Extended Helpers: You can't delete one of them - they are always paired! And you must open them in front of something beeing not punctuation and not whitespace!
    - when beeing behind such a char and pressing backspace, the char before is deleted (TODO: similar for del)
    - when inserting one, the other one is always inserted if it isn't already there
    - groups created by them MUST be prevent-groups!
    - TODO: to be sure and to handle pasting and partial overwritings of symbols, every update is sanitized!    
    */
    solidpairs: "$$``",    
    prevent: ["math", "imath", "src", "isrc", "url", "link-text", "media-title"], // if all selections are in those regions, none of the above effects is applied
    
}, function (cm: CMEditEx, val, old) {
    if (!util.defined(cm.state.iwids)) cm.state.iwids = [];
    if (old && old != (CodeMirror as any).Init) {
        cm.state.autocomplete = null;
        cm.removeKeyMap(cm.state.autocomplete.keymap);
    }
    if (val) {
        cm.state.autocomplete = {
            openpairs: val.openpairs || "",
            solidpairs: val.solidpairs || "",
            prevent: val.prevent || [],
            keymap: {
                Backspace: handleBackspace // Todo: DEL?
            }
        };

        const addToKeymap = str => {
            for (let i = 0; i < str.length; i++) {
                const ch = str.charAt(i);
                const key = "'" + ch + "'";
                if (!cm.state.autocomplete.keymap[key]) {
                    cm.state.autocomplete.keymap[key] = (cm: CMEditEx) => handleChar(cm, ch);
                }
            }
        };
        addToKeymap(cm.state.autocomplete.openpairs);
        addToKeymap(cm.state.autocomplete.solidpairs);

        cm.addKeyMap(cm.state.autocomplete.keymap);
        //cm.on("beforeChange", sani_cm);
    }

});

/*
(|) -> |
*/
function removeEmptyPairs(doc: CodeMirror.Doc, ranges: Array<{anchor: CodeMirror.Position, head: CodeMirror.Position}>, pairs: string): boolean {
    for (let i = 0; i < ranges.length; i++) {
      if (!rEmpty(ranges[i])) return false;
      const around = charsAround(doc, ranges[i].head);
      if (!around || pairs.indexOf(around) % 2 != 0) return false;
    }
    for (var i = ranges.length - 1; i >= 0; i--) {
      var cur = ranges[i].head;
      doc.replaceRange("", Pos(cur.line, cur.ch - 1), Pos(cur.line, cur.ch + 1), "+delete");
    }
    return true;
}

/*
(te*xt*)| -> (te*x|*)
und
text**| -> text|
*/
function skipDeleteOp(doc: CodeMirror.Doc, cm: CMEditEx, ranges: Array<{anchor: CodeMirror.Position, head: CodeMirror.Position}>, pairs: string): boolean {
    for (let i = 0; i < ranges.length; i++) {
        if (!rEmpty(ranges[i])) return false;
        const cur = ranges[i].head;
        const prev = doc.getRange(Pos(cur.line, cur.ch - 1), cur);
        if (prev.length <= 0 || pairs.indexOf(prev) < 0) return false;
    }
    for (var i = ranges.length - 1; i >= 0; i--) {
        var cur = ranges[i].head;
        let jumpCount = 0;
        let a = "";
        let old = "";            
        while(true) {
            a = doc.getRange(Pos(cur.line, cur.ch - jumpCount - 1), Pos(cur.line, cur.ch - jumpCount));
            if (pairs.indexOf(a) < 0 || a === old) break;
            jumpCount++;
            cm.execCommand("goCharLeft");
            old = a;
        }
        if(a === old) doc.replaceRange("", Pos(cur.line, cur.ch - jumpCount - 1), Pos(cur.line, cur.ch - jumpCount + 1), "+delete");
        else doc.replaceRange("", Pos(cur.line, cur.ch - jumpCount - 1), Pos(cur.line, cur.ch - jumpCount), "+delete");
    }
    return true;
}

function handleBackspace(cm: CMEditEx) {    
    if (!cm.state.autocomplete || cm.getOption("disableInput")) return CodeMirror.Pass;

    const pairs = cm.state.autocomplete.openpairs;

    const doc = cm.getDoc();
    const ranges = doc.listSelections();

    
    let prevented = 0; 
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];   
        if(wholeRangePrevented(cm, range)) prevented++;
    }
    if(prevented === ranges.length) return CodeMirror.Pass;


    let changed = removeEmptyPairs(doc, ranges, pairs);
    changed = changed || skipDeleteOp(doc, cm, ranges, cm.state.autocomplete.solidpairs);
    if(!changed) return CodeMirror.Pass;
}


function handleChar(cm: CMEditEx, ch: string) {
    if (!cm.state.autocomplete || cm.getOption("disableInput")) return CodeMirror.Pass;

    const pairs = cm.state.autocomplete.openpairs;
    const pos = pairs.indexOf(ch);
    if (pos == -1) return CodeMirror.Pass;

    const doc = cm.getDoc();
    const ranges = doc.listSelections();

    const identical = pairs.charAt(pos + 1) == ch;
    const opening = pos % 2 == 0;

    /*
    uppercase is selection, | is cursor

    surround: TEXT -> (TEXT)
    both: | -> (|)
    skip: (bla|) -> (bla)|
    */
    let type;

    let prevented = 0; 

    for (let i = 0; i < ranges.length; i++) {
        let range = ranges[i];   
        if(wholeRangePrevented(cm, range)) prevented++;
        let cur = range.head;
        let curType;
        let next = doc.getRange(cur, Pos(cur.line, cur.ch + 1)); // 1 char Lookahead
        if (opening && !rEmpty(range)) {
            curType = "surround";
        } else if ((identical || !opening) && next == ch) {
            curType = "skip";
        } else if (opening && (cm.state.autocomplete.solidpairs.indexOf(ch) >= 0 ||
                                doc.getLine(cur.line).length == cur.ch ||
                                isClosingBracket(next, pairs) ||
                                /\s/.test(next))) {
            curType = "both";
        } else {
            return CodeMirror.Pass;
        }
        if (!type) type = curType;
        else if (type != curType) return CodeMirror.Pass;
    }

    if(prevented === ranges.length) return CodeMirror.Pass;


    const left = pos % 2 ? pairs.charAt(pos - 1) : ch;
    const right = pos % 2 ? ch : pairs.charAt(pos + 1);
    cm.operation(function () {
        if (type == "skip") {
            cm.execCommand("goCharRight");
        } else if (type == "surround") { // TODO: when surrounding, leading space and punctuation is exluded, e.g. ,BLABLA!  -> ,*BLABLA! *
            const sels = doc.getSelections();
            for (var i = 0; i < sels.length; i++)
                sels[i] = left + sels[i] + right;
            (doc as any).replaceSelections(sels, "around");
            const sels2 = doc.listSelections().slice();
            for (var i = 0; i < sels2.length; i++)
                sels2[i] = contractSelection(sels2[i]);
            doc.setSelections(sels2);
        } else if (type == "both") {
            doc.replaceSelection(left + right, null);
            (cm as any).triggerElectric(left + right);
            cm.execCommand("goCharLeft");
        }
    });

}

function contractSelection(sel: {
    anchor: CodeMirror.Position,
    head: CodeMirror.Position
}) {
    var inverted = (CodeMirror as any).cmpPos(sel.anchor, sel.head) > 0;
    return {
        anchor: new Pos(sel.anchor.line, sel.anchor.ch + (inverted ? -1 : 1)),
        head: new Pos(sel.head.line, sel.head.ch + (inverted ? 1 : -1))
    };
}

// Checks if range is empty
function rEmpty(r: {
    anchor: CodeMirror.Position,
    head: CodeMirror.Position
}): boolean {
    return r.anchor.line === r.head.line && r.anchor.ch === r.head.ch;
}

// if pairs consists of opening and closing "brackets", this function returns if ch is a closing one 
function isClosingBracket(ch: string, pairs: string) {
    var pos = pairs.lastIndexOf(ch);
    return pos > -1 && pos % 2 == 1;
}

// Returns the char before AND after pos or null
function charsAround(doc: CodeMirror.Doc, pos: CodeMirror.Position) {
    var str = doc.getRange(Pos(pos.line, pos.ch - 1),
                          Pos(pos.line, pos.ch + 1));
    return str.length == 2 ? str : null;
}

function wholeRangePrevented(cm: CMEditEx, range: {anchor: CodeMirror.Position, head: CodeMirror.Position}): boolean {
    return util.testIntersect( (cm as any).getTokenTypeAt(range.head).split(" "), cm.state.autocomplete.prevent)
            && (rEmpty(range) || util.testIntersect( (cm as any).getTokenTypeAt(range.anchor).split(" "), cm.state.autocomplete.prevent))
}