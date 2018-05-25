
import * as CodeMirror from "codemirror";
import * as util from "../util/util";
import { CMEdit, InlineWidget, CMEditEx } from "./iwids";
import { mathFormat, mathSplit, _math } from "../editor/math";
import { sani_cursor } from "./navigateFormula";


// TODO: Wenn man eine Formel vor den anderen erzeugt, gibt es schwere Probleme beim updaten! Wir brauchen ein besseres System um die char,line-Positionen zu kriegen, als den mode! Das würde auch das Problem der nicht aktuellen Zeilenzahlen lösen.
// TODO: Wenn man eine noch leere Formel am Ende einer Zeile hat und davor umbricht, wird danach das Dokument zerstört!

const changeProc = (cm: CMEditEx, ch) => {

    if(!util.defined(cm.state.iwids)) console.error("Error 7");

    cm.state.iwids.forEach(fw => fw.inuse = false);


    if(cm.state.formula) $(".cm-math", cm.getWrapperElement()).each((i, obj) => {
      
        const friendElem = $(obj);
        let inlwidid = -1;
        let ch, line;
        let center = false;
        friendElem.attr('class').split(/\s+/).forEach(e => {
            if(util.startsWith(e, "cm-inlwid")) {
                const values = e.substr("cm-inlwid".length).split("x");
                if(values.length !== 3) console.error(values);
                inlwidid = parseInt(values[0]);
                line = parseInt(values[1]);
                ch = parseInt(values[2]);
            } 
            if(e === "cm-math-center") {
                center = true;
            }
        });

        if(inlwidid < 0) {
            console.error("Error 3");
        }

        const t = friendElem.text();

        if(inlwidid < cm.state.iwids.length) { // Update existing iwid
            cm.state.iwids[inlwidid].ch = ch;
            cm.state.iwids[inlwidid].line = line;
            cm.state.iwids[inlwidid].inuse = true;
            cm.state.iwids[inlwidid].center = center;
        
            if(cm.state.iwids[inlwidid].str !== t) {
                cm.state.iwids[inlwidid].str = t;
                cm.state.iwids[inlwidid].width = mathSplit(t)[0];
                cm.state.iwids[inlwidid].height = mathSplit(t)[1];                
            
                if(util.defined(cm.state.iwids[inlwidid].obj.m)) {
                    if(mathSplit(t)[2] !== cm.state.iwids[inlwidid].obj.m.latex()) {
                        console.log(mathSplit(t)[2]+ "    "+ cm.state.iwids[inlwidid].obj.m.latex())
                        cm.state.iwids[inlwidid].obj.m.latex(mathSplit(t)[2]);
                    }
                }
            }

        } else { // Create new iwid
            
            const container = document.createElement("div");
            container.style.position = "absolute";
            container.style.zIndex = "10";
            
            const myEntry = {
                ch: ch,
                line: line,
                str: t,
                center: center,
                inuse: true,
                width: mathSplit(t)[0],
                height: mathSplit(t)[1],
                obj: { m: undefined, c: container }
            };

            cm.state.iwids.push(myEntry);
            if((cm.state.iwids.length-1) !== inlwidid) {
                console.error("Error 4");
            }
            
            myEntry.obj.m = _math(container, t, function(latex: string, width: number, height: number) {
                const line = myEntry.line;
                myEntry.width = width;
                myEntry.height = height;
                const token = cm.getTokenAt({ ch: myEntry.ch, line: line });
                const x = mathSplit(latex);
                x[0] = width;
                x[1] = height;
                const target = mathFormat(x);
                const rc = cm.getDoc().getRange( { line: line, ch: token.start},  { line: line, ch: token.end});
                //console.log(target + "    " + rc)
                if(target !== rc) {
                    cm.getDoc().replaceRange(target, { line: line, ch: token.start},  { line: line, ch: token.end} );
                }
                // TODO: Aufpassen! Niemals $ einfügen! Bzw. im mode escapen!
                // TODO: Verhindere das escapen von % durch mathquill!
            });
            
            console.log("create new");

            cm.addWidget({ ch: ch, line: line }, container, true);                   
            
        }

    });

    /////////////////////////////// Garbage collector
    cm.state.iwids.forEach(fw => {
        if(!fw.inuse) {
            if(util.defined(fw.obj.m)) {
                fw.obj.m.revert();
            }
            if(util.defined(fw.obj.c.parentNode)) {
                fw.obj.c.parentNode.removeChild(fw.obj.c);
            } else console.error("Strange!");
        }
    });
    cm.state.iwids = util.filter(cm.state.iwids, fw => fw.inuse);
};


const updateW = function(cm: CMEditEx) {
    const w = cm.getWrapperElement().getBoundingClientRect();
    const g = cm.getGutterElement().getBoundingClientRect();
    const stop = cm.getScrollerElement().scrollTop;

    cm.state.iwids.forEach((fw,i) => {
        //setTimeout(() => {
            // Update line number
            /*$(".cm-wid"+i, cm.getWrapperElement()).attr('class').split(/\s+/).forEach(e => {
                if(util.startsWith(e, "cm-inlwid")) {
                    const values = e.substr("cm-inlwid".length).split("x");
                    if(values.length !== 3) console.error(values);
                    fw.line = parseInt(values[1]);
                    fw.ch = parseInt(values[2]);
                } 
            });*/

            const token = cm.getTokenAt({ ch: fw.ch, line: fw.line }, false);
            //console.log(token);
            const typeinvalid = type => (type === null || !util.hasElement("math", type.split(/\s+/)));
            if(typeinvalid(token.type) || token.string !== fw.str) {
                    
                //if(token.string !== fw.str && !typeinvalid(token.type)) console.log(token.string  + " " + fw.str);

                // This might be caused by insertion or deletion of lines
               /* if(util.defined(cm.state.oldLength)) {
                    const newLine = fw.line + (cm.getDoc().lineCount() - cm.state.oldLength);
                    //console.log(newLine);
                    const newToken = cm.getTokenAt({ ch: fw.ch, line: newLine }, false);
                    
                    const fwl = fw.line;
                    $(".cm-wid"+i, cm.getWrapperElement()).attr('class').split(/\s+/).forEach(e => {
                        if(util.startsWith(e, "cm-inlwid")) {
                            const values = e.substr("cm-inlwid".length).split("x");
                            if(values.length !== 3) console.error(values);
                            fw.line = parseInt(values[1]);
                            fw.ch = parseInt(values[2]);
                        } 
                    });
                    console.log($(".cm-wid"+i, cm.getWrapperElement()).attr('class'));
                    console.log(fwl + " " + fw.line + " " + newLine +  " " + newToken.type)
                    //console.log(newToken);
                } */
                console.error("Error 9");
            } else {
                cm.state.oldLength = cm.getDoc().lineCount();
            }

            const rect = cm.charCoords({ ch: fw.ch, line: fw.line }); // TODO: Bei enter oder backslash ist line nicht immer aktuell...
            if(fw.center) {
                fw.obj.c.style.top = (rect.top - w.top + stop) + "px";            
                fw.obj.c.style.left = ( (w.right - w.left - g.width  - fw.width )/2)  + "px";
            } else {
                fw.obj.c.style.top = (rect.top - w.top + stop) + "px";            
                fw.obj.c.style.left = (rect.left - w.left - g.width) + "px";
            }
      // },0);
    });
    
};

CodeMirror.defineOption("formula", false, function(cm: CMEditEx, val) {
    if(!util.defined(cm.state.iwids)) cm.state.iwids = [];
    if (val) {
        cm.state.formula = true;
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
