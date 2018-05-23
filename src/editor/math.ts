
import { IMathQuill, MathQuillConfig, BaseMethods, MathFieldMethods } from "../util/mathquill";
import "../../mathquill-matrix/build/mathquill.min.js";
import "../../mathquill-matrix/build/mathquill.css";
import * as util from "../util/util";


import { loader } from "../GUI/loader";
import * as styles from "../util/styles";


const cmd = "\\%size"; // TODO: Leerzeichen davor statt \

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

export const _math = (htmlElement: HTMLElement, content: string, callback: Function) => {

    const mq = ((window as any).MathQuill.getInterface(1) as IMathQuill);

    let latex = "";

    const changeFun = function(){ 
        if(util.defined(mathField)) {
            //console.log( mathField.latex() ); // Get entered math in LaTeX format
            const nl = mathField.latex();
           // if(nl !== latex) {
                latex = nl;
                callback(latex, $(htmlElement).outerWidth(), $(htmlElement).outerHeight());
                    //htmlElement.getBoundingClientRect().width, htmlElement.getBoundingClientRect().height);
           // }
            
        }
    };

    var mathField = mq.MathField(htmlElement, {
        handlers: { edit: changeFun },
        restrictMismatchedBrackets: false,
        spaceBehavesLikeTab: true,
        autoCommands: 'pi theta sqrt sum', // TODO
        autoOperatorNames: 'sin cos',
    });

    /*$(htmlElement).resize(function() {
        console.log("change");
        changeFun();
    });*/
    // TODO:  Wenn ein latex zum Symbol zusammengefasst wird gibt es größenänderung. Jquery kann das nicht erkenen. Nehme http://marcj.github.io/css-element-queries/

    setTimeout(changeFun,0);// call Init when size is rendered

    htmlElement.style.border = "none";

    (mq as any).registerEmbed('thing', function(data_) {
        return {
          htmlString: '<span class="embedded-html">'+`<div class='${loader.loader}' style='border-color: ${styles.c1}'><div style='background: ${styles.c1}'></div></div>`+'</span>',
          text: function () { return "embedded text" },
          latex: function () { return "\\embed{thing}" } // Text zum kopieren
        };
      });


    mathField.latex(content); // Renders the given LaTeX in the MathQuill field
   
    return mathField;
};