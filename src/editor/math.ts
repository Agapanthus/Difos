
import { IMathQuill, MathQuillConfig, BaseMethods, MathFieldMethods } from "../util/mathquill";

(window as any).jQuery = jQuery;
import "mathquill/build/mathquill.js";
import "mathquill/build/mathquill.css";
import * as util from "../util/util";


import { loader } from "../GUI/loader";
import * as styles from "../util/styles";


const cmd = "\\%size"; // TODO: Leerzeichen davor statt \

export function saniLatex(l: string) {
    // TODO: mathbb not really supported... https://github.com/mathquill/mathquill/issues/200
    l = mathSplit(l)[2];
    const r = l.replace(/\\mathbb\{[^\s\}]+\}/g, e => {
        const s = ("mathbb{").length;
        return "\\" + e.substr(s + 1, e.length-s-2) + " ";
    });


    return r;
}


export function mathFormat(x: [number, number, string]) {
    if(!util.defined(x[2])) return "error";
    if(x[0] <= 0 || x[1] <= 0) return x[2];
    return x[2] + cmd + Math.round(x[0]) + "x" + Math.round(x[1]);
}

export function mathSplit(latex: string): [number, number, string] {
    if(latex.length >= cmd.length +1+1+1) {
        const l = latex.split(cmd);
        if(l.length !== 2) return [-1,-1,l[0]];
        const x = l[1].split("x");
        if(x.length !== 2) return [-1,-1,l[0]];
        const width = parseInt(x[0]);
        const height = parseInt(x[1]);
        return [width,height,l[0]];
    }
    return [-1,-1,latex];
}

export const centeredExtraMargin = 16;

export const _math = (htmlElement: HTMLElement, content: string, callback: Function, exitRight: Function, exitLeft: Function) => {

    const mq = ((window as any).MathQuill.getInterface(1) as IMathQuill);

    let latex = "";

    //let lastChange = Date.now();


    const changeFun = function(){ 
        if(util.defined(mathField)) {
            //console.log( mathField.latex() ); // Get entered math in LaTeX format
            const nl = mathField.latex();
           // if(nl !== latex) {
                latex = nl;

            if($(htmlElement).outerWidth() === 0) return; // Silently drop early change events!

            callback(latex, $(htmlElement).outerWidth(), $(htmlElement).outerHeight() );
                //htmlElement.getBoundingClientRect().width, htmlElement.getBoundingClientRect().height);
           // }
           //console.log(mathField.__controller.cursor.parent)
                
           //lastChange = Date.now();
        }
    };

  
    const outOfFun  = function(d, mf) {
        if(d === 1) exitRight();
        else exitLeft();
    }

    var mathField = mq.MathField(htmlElement, {
        handlers: { edit: changeFun, moveOutOf: outOfFun },
        restrictMismatchedBrackets: false,
        spaceBehavesLikeTab: true,
       // autoCommands: 'pi theta sqrt sum', // TODO
      //  autoOperatorNames: 'sin cos',
    });

    
    /*((mathField as any).__controller.container as JQuery).on("keydown", e => {
        if((e.originalEvent as any).key === " ") {
            const isLastElement = ((mathField as any).__controller.cursor[1] === 0);
            if(isLastElement && (Date.now() - lastChange > 10)) { // Cursor at the end and some time elapsed since the last change (so this wasn't a tex-resolve command)
                console.log(mathField.__controller.cursor.parent)
                console.log("exit");
                //exitLeft();
            }
        }
    });*/

    /*$(htmlElement).resize(function() {
        console.log("change");
        changeFun();
    });*/
    // TODO:  Wenn ein latex zum Symbol zusammengefasst wird gibt es größenänderung. Jquery kann das nicht erkenen. Nehme http://marcj.github.io/css-element-queries/

    setTimeout(changeFun,0);// call Init when size is rendered

    htmlElement.style.border = "none";
/*
    (mq as any).registerEmbed('thing', function(data_) {
        return {
          htmlString: '<span class="embedded-html">'+`<div class='${loader.loader}' style='border-color: ${styles.f.struct}'><div style='background: ${styles.f.struct}'></div></div>`+'</span>',
          text: function () { return "embedded text" },
          latex: function () { return "\\embed{thing}" } // Text zum kopieren
        };
      });*/

    
    mathField.latex(saniLatex(content)); 
    
    setTimeout(_ => { mathField.reflow()}, 0);

    

    return mathField;
};