
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
        const t = cm.getTokenAt(c);
        let classes = (t.type != null) ? t.type.split(/\s+/) : [];
        let before = false;


        // An opening math-Element: Move the cursor to the beginning of the formula
        if(util.hasElement("math-open", classes)) {
            const t1 = cm.getTokenAt({ch: c.ch+1, line: c.line});
            if(t1.type != null && t1.end > c.ch) {
                classes = t1.type.split(/\s+/);
            } else {
                const t2 = cm.getTokenAt({ch: 1, line: c.line+1})
                if(t2.type == null) console.error("Error 6");
                classes = t2.type.split(/\s+/);
            }
            before = true;
        }

        // An math-Element: Move the cursor to the end of the formula
        if(util.hasElement("math", classes)) {
            let inlwidid = -1;
            classes.forEach(e => {
                if(util.startsWith(e, "inlwid")) {
                    const values = e.substr("inlwid".length).split("x");
                    if(values.length !== 3) console.error(values);
                    inlwidid = parseInt(values[0]);
                } 
            });
            if(inlwidid < 0) console.error("Error 5");
            else {
                if(util.defined(cm.state.iwids) && util.defined(cm.state.iwids[inlwidid].obj.m)) {
                    cm.state.iwids[inlwidid].obj.m.focus();
                    if(before) cm.state.iwids[inlwidid].obj.m.moveToLeftEnd();
                    else cm.state.iwids[inlwidid].obj.m.moveToRightEnd();
                }
            }
        }
    }

};
