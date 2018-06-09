
import * as CodeMirror from "codemirror";
import * as util from "../util/util";
import { CMEdit, InlineWidget, CMEditEx } from "./iwids";
import { mathFormat, mathSplit, _math, saniLatex } from "../editor/math";
import { sani_cursor } from "./navigateFormula";


// TODO: Deleting in Formulae leads to serious problems with the part of the line after the math object!
// TODO: Inline-Formlen werden nicht umgebrochen! Vielleicht sogar in der Formel umbrechen...?

function createMath(cm: CMEditEx, ch: number, iline: number, center: boolean, t: string) {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.zIndex = "10";
    
    const myEntry = {
        ch: ch,
        line: iline,
        str: t,
        center: center,
        inuse: true,
        width: mathSplit(t)[0],
        height: mathSplit(t)[1],
        obj: { m: undefined, c: container }
    };

    
    myEntry.obj.m = _math(container, t, function(latex: string, width: number, height: number) {
        const line = myEntry.line;
        myEntry.width = width;
        myEntry.height = height;
        myEntry.str = latex;
        const token = cm.getTokenAt({ ch: myEntry.ch, line: line }, true);


        // TODO: Kind of hack. The problem: myEntry.ch might be wrong at this point.
        if(token.type === null || !(util.hasElement("imath", token.type.split(" ")) || util.hasElement("math", token.type.split(" "))) ) {
            console.error("Error T")
           // console.log(token);
            return;
        }
        if(token.start+1 != myEntry.ch ) {
            console.error("Error P");
           // console.log(token);
          //  console.log(myEntry);
            return;
        }

        const x = mathSplit(latex);
        x[0] = width;
        x[1] = height;
        const target = mathFormat(x);
        const rc = cm.getDoc().getRange( { line: line, ch: token.start},  { line: line, ch: token.end});
        //console.log("update doc " + line + ":  " + rc + "  ->  " + target)
        if(target !== rc) {
            //console.log(rc + " -> " + target);
            cm.getDoc().replaceRange(target, { line: line, ch: token.start},  { line: line, ch: token.end});
        }
        // TODO: Aufpassen! Niemals $ einfügen! Bzw. im mode escapen!
        // TODO: Verhindere das escapen von % durch mathquill!
        
    }, _=> {
        // Exit to the left
        cm.focus();
        cm.getDoc().setCursor({line: myEntry.line, ch: myEntry.ch + myEntry.str.length});

        
    });
    
    console.log("create new");

    cm.addWidget({ ch: ch, line: myEntry.line }, container, true);          

    
    return myEntry;
}

function updateMath(cm: CMEditEx, inlwidid: number, ch: number, line: number, center: boolean, t: string) {
    cm.state.iwids[inlwidid].ch = ch;
    cm.state.iwids[inlwidid].line = line;
    cm.state.iwids[inlwidid].center = center;

    if(cm.state.iwids[inlwidid].str !== t) {
        cm.state.iwids[inlwidid].str = t;
        cm.state.iwids[inlwidid].width = mathSplit(t)[0];
        cm.state.iwids[inlwidid].height = mathSplit(t)[1];            
        
        if(util.defined(cm.state.iwids[inlwidid].obj.m)) {
            if(mathSplit(t)[2] !== cm.state.iwids[inlwidid].obj.m.latex()) {
                cm.state.iwids[inlwidid].obj.m.latex(saniLatex(mathSplit(t)[2]));
            }
        }    
    }
}

const changeProc = (cm: CMEditEx, ch) => {
    if(cm.state.formula_changing) { // Abort recursiv calls
        return;
    } 
    cm.state.formula_changing = true;


    if(!util.defined(cm.state.iwids)) console.error("Error 7");

    cm.state.iwids.forEach(fw => fw.inuse = false);
    

    const toCreate = [];
    const toUpdate = [];

    if(cm.state.formula) $(".cm-math, .cm-imath", cm.getWrapperElement()).each((i, obj) => {
      
        const friendElem = $(obj);
        let ch;
        let center = false;
        friendElem.attr('class').split(/\s+/).forEach(e => {
            if(util.startsWith(e, "cm-ch")) {
                const value = e.substr("cm-ch".length);
                ch = parseInt(value);
            } 
            if(e === "cm-math") {
                center = true;
                ch = 2;
            }
        });
        let friendLineElem = friendElem.parent().parent();
        if(!friendLineElem.hasClass("CodeMirror-line")) {
            console.error("Error 12");
            return;
        }
        
        /*if(!friendLineElem.parent().hasClass("CodeMirror-code")) { // e.g., if there are is a gutter
            friendLineElem = friendLineElem.parent();
            console.log("advance");
            console.log(friendLineElem)
            console.log(friendElem[0])
            console.log(friendElem.parent()[0])
            console.log(friendElem.parent().parent()[0])
            console.log(friendElem.parent().parent().attr("class"))
            console.log(friendElem.parent().parent().parent()[0])
            console.log(friendElem.parent().parent().parent().attr("class"))
        }
        if(!friendLineElem.parent().hasClass("CodeMirror-code")) {
            console.error("Error 12b");
            return;
        }*/
        
        let friendCodeElem = friendLineElem.parent();
        if(!friendCodeElem.hasClass("CodeMirror-code")) { // e.g., if there are is a gutter
            console.log("ad")
            console.log(friendLineElem.parents())
        console.log(friendLineElem.parent().attr("class"));
        
            friendCodeElem = friendCodeElem.parent();
        }
        if(!friendCodeElem.hasClass("CodeMirror-code")) {
            console.error("Error 12b");
            return;
        }
      /*  const friendCodeElem = friendLineElem.closest( ".CodeMirror-code" );
        if(friendCodeElem.empty()) {
            console.error("Error 12b");
            return;
        }*/
        const line = friendCodeElem.children().index(friendLineElem);
        
        const t = friendElem.text();
        const nameList = cm.state.iwids.map(a => a.inuse ? "%disabled" : mathSplit(a.str)[2]);
        const inlwidid = nameList.indexOf(mathSplit(t)[2]);

        if(inlwidid < cm.state.iwids.length && inlwidid >= 0) { // Update existing iwid
            cm.state.iwids[inlwidid].inuse = true;
         //   updateMath(cm, inlwidid, ch, line, center, t);
            toUpdate.push({
                inlwidid: inlwidid,
                ch:ch,
                line:line,
                center: center,
                t: t
            })
        } else { // Create new iwid
            toCreate.push({
                ch: ch,
                line: line,
                t: t,
                center: center
            });
        }

    });


    ///// Update
    for(let u of toUpdate) {
        updateMath(cm, u.inlwidid, u.ch, u.line, u.center, u.t);
    }

    /////////////////////////////// Garbage collector / Recycling manager
    cm.state.iwids.forEach((fw, index) => {
        if(!fw.inuse) {
            const newMath = toCreate.pop();
            if(newMath) {
                cm.state.iwids[index].inuse = true;
                updateMath(cm, index, newMath.ch, newMath.line, newMath.center, newMath.t);
            } else {
                if(util.defined(fw.obj.m)) {
                    fw.obj.m.revert();
                }
                if(util.defined(fw.obj.c.parentNode)) {
                    fw.obj.c.parentNode.removeChild(fw.obj.c);
                } else console.error("Strange!");
            }
        }
    });

    // Garbage Collect
    cm.state.iwids = util.filter(cm.state.iwids, fw => fw.inuse);

    // Add new ones
    cm.operation(function () {
        toCreate.forEach(newMath => {
            cm.state.iwids.push(createMath(cm, newMath.ch, newMath.line, newMath.center, newMath.t));
        });
    });

    cm.state.formula_changing = false;

    // TODO: When the size of formula rendered and is added to them dom: Make sure, it won't become a step in history! Otherwise, you can go back to unsized math...
    // Alternatively: Hide math after every change from cm to mq until the size has updated 
};


const updateW = function(cm: CMEditEx) {
    const w = cm.getWrapperElement().getBoundingClientRect();
    const g = cm.getGutterElement().getBoundingClientRect();
    const doc = document.documentElement;
    const wscroll = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0); // https://stackoverflow.com/a/3464890/6144727
    const stop = cm.getScrollerElement().scrollTop - wscroll;


    cm.state.iwids.forEach((fw,i) => {
        const rect = cm.charCoords({ ch: fw.ch, line: fw.line }); // TODO: Bei enter oder backslash ist line nicht immer aktuell...
        if(fw.center) {
            fw.obj.c.style.top = (rect.top - w.top + stop) + "px";            
            fw.obj.c.style.left = ( (w.right - w.left - g.width  - fw.width )/2)  + "px";
        } else {
            fw.obj.c.style.top = (rect.top - w.top + stop) + "px";            
            fw.obj.c.style.left = (rect.left - w.left - g.width) + "px";
        }
    });
    
};

CodeMirror.defineOption("formula", true, function(cm: CMEditEx, val) {
    if(!util.defined(cm.state.iwids)) cm.state.iwids = [];
    if (val) {
        cm.state.formula = true;
        cm.state.formula_changing = false;
        $(cm.getWrapperElement()).addClass("math-visual");
        cm.on("changes", changeProc);
        cm.on("update", updateW);
        cm.on("cursorActivity", sani_cursor);
        setTimeout(function() {            
            changeProc(cm, undefined);
            updateW(cm);
            cm.refresh();
        }.bind(cm), 0);
    } else {
        cm.state.formula = null;
        $(cm.getWrapperElement()).removeClass("math-visual");
        cm.off("changes", changeProc);
        cm.off("update", updateW);
        cm.off("cursorActivity", sani_cursor);
        setTimeout(function() {            
            changeProc(cm, undefined); // Will delete everything
            cm.refresh();
        }.bind(cm), 0); 
    }
});
