
import * as CodeMirror from "codemirror";
import * as util from "../util/util";
import { CMEdit, InlineWidget, CMEditEx } from "./iwids";


////////// Go into formula

export const sani_cursor = (cm: CMEditEx) => {
    if(!cm.state.formula) {
        console.error("Strange!");
        return;
    }

    // TODO: Im WYSIWYG-Modus beim Navigieren die Formatierungszeichen überspringen

    if(cm.hasFocus()) {
        const doc = cm.getDoc();
        const c = doc.getCursor();
        const t = (cm as any).getTokenTypeAt(c) as string|null;
        let classes = (t != null) ? t.split(/\s+/) : [];
        let before = false;

        let refpos = c.ch;

        // An opening math-Element: Move the cursor to the beginning of the formula
        if(util.hasElement("math-open", classes)) {
            const t1 = cm.getTokenAt({ch: c.ch+1, line: c.line}, true);
            refpos = t1.end; // So that you can find the mathElement before this position
            if(t1.type != null && t1.end > c.ch) {
                classes = t1.type.split(/\s+/);
            } else console.error("Error 6");
            before = true;
        }

        // An math-Element: Move the cursor to the end of the formula (or it was an opening one and before==true)
        if(util.hasElement("math", classes) || util.hasElement("imath", classes)) {
            let inlwidid = -1;
         
            // Find the last math-element before this position
            let maxch = 0;
            for(let i in cm.state.iwids) {
                if(cm.state.iwids[i].line === c.line) {
                    if(cm.state.iwids[i].ch > maxch && (cm.state.iwids[i].ch - 1) <= refpos) {
                        maxch = cm.state.iwids[i].ch;
                        inlwidid = parseInt(i);
                    }
                }
            }

            if(inlwidid < 0) {
                //console.error("Error 5");
                // This ok - there is the situation of the newly created math-element which is not yet in the list.
            } else {
                if(util.defined(cm.state.iwids) && util.defined(cm.state.iwids[inlwidid].obj.m)) {
                    cm.state.iwids[inlwidid].obj.m.focus();
                    if(before) cm.state.iwids[inlwidid].obj.m.moveToLeftEnd();
                    else cm.state.iwids[inlwidid].obj.m.moveToRightEnd();
                }
            }
        }
    }

};
