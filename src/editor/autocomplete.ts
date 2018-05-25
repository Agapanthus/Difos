import * as CodeMirror from "codemirror";
import * as util from "../util/util";
import { CMEdit, InlineWidget, CMEditEx } from "./iwids";
import { Stream } from "stream";

import * as CMH from "../../node_modules/codemirror/src/line/highlight.js";

// Calculates state based on the given state and code
function hypotheticalState(cm: CMEditEx, lines: Array<string>, firstStart: number, firstLine: number, istate: any) {
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


const sani_cm = (cm: CMEditEx, change: { from: CodeMirror.Position, to: CodeMirror.Position, origin: string, text: Array<string>, update: (from: CodeMirror.Position, to: CodeMirror.Position, text: Array<string>, origin:string) => void}) => {
    //console.log(change);

    // TODO: Für Eingabe per Tastatur sollte eine Lösung analog zu http://codemirror.net/demo/closebrackets.html verwendet werden, um cursor und selection angemessen zu behandeln

    // TODO: Wenn man Texte wie "$ **" vor "**" einfügt  wird fälschlicherweise das "**" rausgeführt, obwohl $ das schluckt. 


    const getSym = f => {switch(f) {
        case "math": return "$"; 
        case "isrc": return "`";
        case "src": return "```"; 
        case "bold": return "**"; 
        case "italic": return "__";
        case "capi": return "%%";
        default: return "";
    }};
    const sensitiveSym = "$*`*_%"; // If a char is not one of these, it can safely be ignored when rendering formatting (except when used as separator)
    
    if(change.text.length == 1 && change.text[0] == "") { // Something deleted
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
        for(let i=change.to.ch; i<fl.length; i++) {
            if(sensitiveSym.indexOf(fl.charAt(i)) >= 0) {
                sensEnding += fl.charAt(i);
            } else break;
        }
        
        // The part before the insertion
        const firstpart = doc.getLine(change.from.line).substr(0,change.from.ch);

        // The changed part
        const changedPlus = util.deepCopy(change.text);
        changedPlus[0] = firstpart + changedPlus[0];
        changedPlus[changedPlus.length - 1] += " " + sensEnding; // TODO: Was tun mit sensEnding?

        // The unchanged part
        const beforePlus = [];
        for(let n = change.from.line+1; n < change.to.line; n++) {
            beforePlus.push(doc.getLine(n));
        }
        beforePlus.push(doc.getLine(change.to.line).substr(0, change.to.ch + sensEnding.length)); 
        
        // Calculate start before the first line
        let firstState;
        if(change.from.line === 0) {
            firstState = cm.getDoc().getMode().startState();
        } else {
            firstState = (cm as any).getStateAfter(change.from.line - 1, true);
        }

        
        //const beforeState = hypotheticalState(cm, [firstpart], 0, change.from.line, firstState);
        //const beforeForm = beforeState.form as Array<string>;
       

        const afterForm = hypotheticalState(cm, beforePlus, 0, change.from.line, firstState).format as Array<string>;
        const afterChangedForm = hypotheticalState(cm, changedPlus, 0, change.from.line, firstState).format as Array<string>;
        
           
        console.log("\n////////////////////////////");
        console.log(firstState.format)
        console.log(beforePlus);
        console.log(afterForm);
        console.log(changedPlus);    
        console.log(afterChangedForm);
        
            
        let adds = "";
        // add formatting
        for(const f of afterChangedForm) {
            if(!util.hasElement(f, afterForm)) {
                adds += getSym(f) + " ";
            }
        }
        // remove formatting
        for(const f of afterForm) {
            if(!util.hasElement(f, afterChangedForm)) {
                adds += getSym(f) + " ";
            }
        }
        adds = adds.trim();
        

        // If there are control-chars at the end of the insertion, get them
        let sensStart = "";
        const lt = change.text[change.text.length - 1];
        for(let i=lt.length-1; i >= 0; i--) {
            if(sensitiveSym.indexOf(lt[i]) >= 0) {
                sensStart = lt[i] + sensStart;
            } else break;
        }

        // Remove some unneccessary whitespaces
        adds = sensStart + " " + adds + " " + sensEnding;
        let spl = adds.split(new RegExp(`[^${util.escapeRegExp(sensitiveSym)}]`));
        adds = util.reduce(spl, (acc, val) => {
            if(acc.length > 0 && val.length > 0 && acc[acc.length - 1] === val[0]) return acc + " " + val;
            return acc + val;
        });
        adds = adds.substr(sensStart.length, adds.length  - sensStart.length - sensEnding.length);


        // Update changes
        const updated = util.deepCopy(change.text);
        updated[updated.length-1] = updated[updated.length-1] + adds; 
        if(adds.length > 0) {
            change.update(change.from, change.to, updated, change.origin);
        }
    }
    
};



CodeMirror.defineOption("autocomplete", false, function(cm: CMEditEx, val) {
    if(!util.defined(cm.state.iwids)) cm.state.iwids = [];
    if (val) {
        cm.state.autocomplete = true;
        cm.on("beforeChange", sani_cm);
    } else {
        cm.state.autocomplete = null;
        cm.off("beforeChange", sani_cm);
    }
});
