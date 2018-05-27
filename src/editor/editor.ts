
import {style, keyframes, types, media } from 'typestyle';
import * as $ from "jquery";
import * as styles from "../util/styles";
import * as CodeMirror from "codemirror";

import "./mode";


import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
// import 'codemirror/addon/display/autorefresh.js'; // TODO: Do something similar


import * as util from "../util/util";

import "./formula";
import "./navigateFormula";
import "./autocomplete";
import { CMEdit, InlineWidget, CMEditEx } from "./iwids";

import "./editor.scss";


export class Editor {
    private options: {
        syncOut: Function,
        syncIn: Function
    };
    private rendered: HTMLElement;
    private element: HTMLElement;
    private cm: CodeMirror.Editor;

    constructor(a: HTMLElement) {

        this.options = {
            syncIn: undefined,
            syncOut: undefined
        };
        
        
        this.render(a);

    }

    private render(a: HTMLElement) {

        if(this.rendered === a) {
            return;
        }
        this.element = a;


        let keyMaps = [];
        // TODO: Weiter Shortcuts 1438
        
        keyMaps["Enter"] = "newlineAndIndentContinueMarkdownList";
        keyMaps["Tab"] = "tabAndIndentMarkdownList";
        keyMaps["Shift-Tab"] = "shiftTabAndUnindentMarkdownList";
        keyMaps["Ctrl-1"] = (cm: CMEditEx) => cm.setOption("WYSIWYG", !cm.getOption("WYSIWYG"));
        keyMaps["Ctrl-2"] = (cm: CMEditEx) => cm.setOption("formula", !cm.getOption("formula"));
        keyMaps["Esc"] = function(cm) {
           console.log("esc");
           console.log(cm);
        };
    



        this.rendered = a;

        this.cm = CodeMirror(host => a.appendChild(host), {
            value: 
    
`# Difos
Man kann Text *formatieren*, wie man will! Dabei gibt es sogar _über*lappendes_ Layout* und man kann auch Namen ~Bekannter~ %Irgendwelcher% Leute angemessen notieren. Die Zeichen heben sich gegenseitig auf, d.h., **doppelt** wirkt nicht, ***dreifach*** schon. In der Verwendung am Wortende, e.g. 1%, 2%; 3% und 4*, nicht jedoch wenn sie mehrfach sind, wie etwa Einkaufs_liste und Listen_Einkauf, bleiben sie ohne Beachtung.
Das _Zeilenende_ können solche Zeichen _nicht überspannen_. Sollen sie aber auch nicht!

Mehrfache  Leerzeilen- und Zeichen   werden  im Allgemeinen ignoriert außer sie stehen am #Satzanfang.
 Denn die braucht man für Listen. 
Siehe dazu Abschnitt 3. Was zu beweisen war. []
[Links](https://en.wikipedia.org/wiki/Link) gibt es, eingebettete Bilder ![das ist keins](http://bild.de) vorerst nicht. Bilder kann man aber absetzen (wie auf Medium) indem man sie in eine ganz eigene Zeile schreibt -- das ist ohnehin cooler:
![Abgesetztes Panorama](https://upload.wikimedia.org/wikipedia/commons/5/57/Galunggung.jpg)
Jaja, so musst das aussehen!

## Subsections 
gibt es auch!
Und Formeln wie $\\sum_{x=0}^{\\infty}\\pi$ oder $x=0$ oder sogar abgesetzte Formeln wie z.B.
$\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$
gibt es au$\\chi$! qed
Und natürlich \`*Quellcode*\` mit allen Schikanen! 

\`haskell Binomial
n \\\`choose\\\` k
    | k < 0     = 0
    | k > n     = 0
    | otherwise = factorial n \\\`div\\\` (factorial k * factorial (n-k)) \`

### Listen

a) alles was nicht eingerückt ist, kann keine Liste sein.
 1. Hallo
 2. und so
  i) Weiter
  ii) Lorem
  iii) Ipsum
   dolor sit amet 

   Quartzum kulmur
  iv) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce sodales scelerisque erat vel rhoncus. Duis vehicula ante quam, nec euismod leo aliquam ut. 
  i. immer
  ii. weiter
   * weiter
   * und weiter
 3. Jaja.
  a) und so
   > Auch Zitate sind
   > Listen
   Wirklich!
   > ...wahr!
  b) immer weiter, inkl _Formatierung_.
  c) immer immer weiter
Nicht eingerückt und auch sofort Ende der Liste!

`

/*
`
1. Hallo
2. und so
 i) Weiter
 ii) Lorem
  iii)
 iii) Aha
 Weiter gehts

 Mit absatz
 iv) Yeah!
3. und so
     > Zitat!
     > mit 2 Zeilen!
     * Liste so
     * weiter
      - oder so
      - weiter?
`
*/
, 
            mode: "difosMode",
            theme: "difos-default",
            extraKeys: keyMaps,
            lineNumbers: false,
            autofocus: true,
            dragDrop: true,
            indentUnit: 1,
            tabSize: 1,
            indentWithTabs: true,
            placeholder: "Hier schreiben",
            lineWrapping: true,
            foldGutter: false,
            viewportMargin: Infinity, // TODO: Mittelmäßig für Performance...
        });

        if(this.options.syncOut) {
            const cm = this.cm;
            cm.on("change", e => {
                this.options.syncOut(e);
            });
        }

        if(this.options.syncIn) {
            // TODO
        }

/*
        const container = document.createElement("div");
        _math(container, undefined);
        //var $widget = $(container).height(50);
        const lineWidget = this.cm.addLineWidget(4, container);
*/

        // Fixes CodeMirror bug (#344)
        const temp_cm = this.cm;
        setTimeout(function() {
            temp_cm.refresh();
        }.bind(temp_cm), 0);
    }
}




CodeMirror.defineOption("WYSIWYG", false, function(cm: CMEditEx, val) {
    if (val) {
        $(cm.getWrapperElement()).addClass("WYSIWYG");
        cm.refresh();
    } else {
        $(cm.getWrapperElement()).removeClass("WYSIWYG");
        cm.refresh();
    }
});

// See http://codemirror.net/demo/indentwrap.html
function indentWrap(cm, line, elt) {
    const charWidth = cm.defaultCharWidth();
    const basePadding = 4;
    
    // TODO: Do I really need to check this?
    if(cm.getOption("tabSize") !== 1) console.error("Assuming tab == 1");
    
    const white = line.text.search(/\S|$/);
    const spacesw = white; // + line.text.substr(0, white).split(/\t/).length * (cm.getOption("tabSize") - 1);
    const _off = parseInt(styles.indent) * spacesw;
    elt.style.textIndent = "-" + _off + "px";
    elt.style.paddingLeft = (basePadding + _off) + "px";
}

CodeMirror.defineOption("indentWrap", true, function(cm: CMEditEx, val) {
    if (val) {
        cm.state.indentWrap = true;
        cm.on("renderLine", indentWrap);
        cm.refresh();
    } else {
        cm.state.indentWrap = false;
        cm.off("renderLine", indentWrap);
        cm.refresh();
    }
});

