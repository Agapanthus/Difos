
import * as CodeMirror from "codemirror";
import * as util from "../util/util";
import { CMEdit, InlineWidget, CMEditEx } from "./iwids";

///////// Prevent maleformed edits

// Returns the valid position before
const before = (a:CodeMirror.Position, doc: CodeMirror.Doc) => {
    if(a.ch === 0) {
        if(a.line === 0) return { ch: a.ch, line: a.line };
        else {                
            return { ch: doc.getLineHandle(a.line-1).text.length, line: a.line-1 };
        }
    } else {
        return { ch: a.ch-1, line: a.line };
    }
};

// Returns the char before 
const getCharBefore = (a: CodeMirror.Position, doc: CodeMirror.Doc) => {
    if(a.ch === 0) {
        if(a.line === 0) return "";
        else {                
            const l = doc.getLine(a.line - 1);
            if(l.length <= 0) return "";
            return l[l.length - 1];
        }
    } else {
        const l = doc.getLine(a.line);
        if(a.ch >= l.length) return "";
        return l[a.ch];
    }
};

const sani_cm = (cm: CMEditEx, change: { from: CodeMirror.Position, to: CodeMirror.Position, origin: string, text: Array<string>, update: (from: CodeMirror.Position, to: CodeMirror.Position, text: Array<string>, origin:string) => void}) => {
    //console.log(change);

    
    if(change.text[0] == "") { // Something deleted
        // Parse change + the last char before and the first after
        // if there is a paired symbol: Parse line
        // delete remove paired symbol symbol
    } else { // Something added
        const c = change.text[0];
        const l = cm.getDoc().getLine(change.from.line);

        const nbefore = (l: string, b: CodeMirror.Position, n: number, replacement: string) => (n === 0) ? replacement[0] : (b.ch >= n) ? l[b.ch-n] : "";
        const nafter = (l: string, b: CodeMirror.Position, n: number,  replacement: string) => (n === 0) ? replacement[0] : (l.length > (b.ch+n-1)) ? l[b.ch+n-1] : "";
        // Returns the number of n in {0..*} for which f was true
        const countf = (f: (n: number)=>boolean) => {
            let n = 0;
            while(true) {
                if(!f(n)) return n;
                n++;
            }
        };

        if(c.length === 1) { // Only one char added 
            let add = "";
            let s0 = countf(n => nbefore(l,change.from,n,c) === '*'); 
            if((s0 % 2) === 0 && s0 > 0) { 
                add += "**";
            } else {
                s0 = countf(n => nafter(l,change.to,n,c) === '*'); 
                console.log(s0);
                if((s0 % 2) === 0 && s0 > 0) { 
                    add += "**";
                }
            }

            // TODO: Aber nicht in code oder math
            
            
            if(add.length > 0) change.update(change.from, change.to, [change.text + add], change.origin);

        } else {

            if(c[0] === '*') {

            }
        }


        /*pairs.forEach(p => {



        });*/

        //if(c[0] === '*') // *_%`$
        // Parse change + the last char before and the first after the change
        // add additional symbols to pair

        // Enter formula if this is directly after $ or $$ or $$\n
    }
    
};



CodeMirror.defineOption("autocomplete", true, function(cm: CMEditEx, val) {
    if(!util.defined(cm.state.iwids)) cm.state.iwids = [];
    if (val) {
        cm.state.autocomplete = true;
        cm.on("beforeChange", sani_cm);
    } else {
        cm.state.autocomplete = null;
        cm.off("beforeChange", sani_cm);
    }
});
