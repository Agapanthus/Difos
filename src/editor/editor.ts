

/*
// TODO: Wenn man ein $ in eine Formel tippt oder kopiert, gibt's Ärger
// TODO: Wenn man Rückgängig macht in codemirror, werden die Größenberechnungen umgekehrt
// TODO: Wenn man drag'n'drop macht in Codemirror, muss man außerhalb der Formel anpacken
// TODO: Wenn man in einer FOrmel ctrl-z drückt, wird das nicht an codemirror gesendet
// TODO: man kann nicht in und aus Formeln navigieren mit Pfeiltasten, Leertaste und Backslash
// TODO: man wird nicht automatisch in eine Formel geleitet, wenn man ein $ tippt
// TODO: $ wird nicht zu $$ durch tippen von $ am Anfang
// TODO: Automatisch Umbrüche in $$ $$ einfügen!
// TODO: Das erstellen von offenen Formatierungs-paaren ist noch möglich. Das sollte unbedingt verhindert werden!

// TODO: Wenn man nahe einer Formel klickt, wird on Release der Cursor wieder aus der Formel rausgenommen!

// TODO: Code-Boxen!
*/



/*

Folgendes wird mit Steuercodes und als Kontext-menü implementiert, siehe zum Vervollständigen: http://codemirror.net/demo/xmlcomplete.html, http://codemirror.net/demo/closebrackets.html und http://codemirror.net/demo/closetag.html
- __italic__, Strg+i
- **bold**, Strg+b
- %%Kapitälchen%%, Strg+e
- #Überschriften bzw ## ### ####, Strg+1,2,3,4,5
- $Formeln$, Strg+m, oder in neuer Zeile und so abgesetzt: Strg+shift+m
- [Links](Url)

Und weitere Features:
- Als lyx exportieren
- search-replace: http://codemirror.net/demo/search.html
- Cursor in- und raus aus Equationumgebung machen; Leerzeichen wirklich wie Tab behandeln!
- undo-redo auch für Formatierung http://foliotek.github.io/DocEditable/demos/undo.html

Und wie kann man abgesetzte Mathe und code integrieren?
- Einfach widget einfügen, den Text davor verstecken und geeignet rein und raus springen, auswahl beim kopieren verhindern!

Und wie kann man inline-Mathe integrieren?
- http://codemirror.net/doc/manual.html#event_renderLine
- http://codemirror.net/doc/manual.html#markText mit replacedWith
- Also, effektiv: Der tatsächliche Text wird ausgeblendet und darüber ein Mathe-Dummy eingefügt, in den man reingeleitet wird,
  sobald man mit dem Cursor dahin gerät. Man editiert im Widget und der Hintergrundtext wird synchron gehalten. Beim Kopieren 
  und für die History wird der Hintergrundtext verwendet.

Zukünftig:
- `Code` und ```javascript Code ```
- Rechtschreibkorrektur: http://codemirror.net/demo/lint.html
- Listen, nested und automatisch fortgeführt, http://codemirror.net/demo/indentwrap.html
    a) b) c)
    1) 2) 3)
    i) ii) iii)
    1. 2. 3.
    -
    *
- "Zitat"
- folding: http://codemirror.net/demo/folding.html
- | Tabellen | wie schön |
  | Ja! | Uh! Yeah! |
- synchronisieren für kollaboratives Schreiben via p2p
- Als pdf mit Seiten-header exportieren
- Formeleingabe verbessern:
    - Cases
    - Equation-Umgebung
    - Klammerpaare hervorheben
    - mathematische Schriftarten rausführen
    - Cursor 

Vorbilder:
    - https://github.com/sparksuite/simplemde-markdown-editor
    - https://github.com/laobubu/HyperMD

*/


import {style, keyframes, types, media } from 'typestyle';
import * as $ from "jquery";
import * as styles from "../util/styles";
import * as CodeMirror from "codemirror";

import "./mode";


import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';


import * as util from "../util/util";

import "./formula";
import "./navigateFormula";
import "./autocomplete";
import { CMEdit, InlineWidget } from "./iwids";

import "./editor.scss";


// TODO: Call this on every edit but not inside of code!
const sanitize = (text:string) => {
    return text
        .replace(/\n\s*\n/g, '\n') // Remove multiple linebreaks
        .replace(/  +/g, ' ') // Remove multiple whitespaces
}

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
        keyMaps["Esc"] = function(cm) {
           console.log("esc");
           console.log(cm);
        };
    



        this.rendered = a;

        this.cm = CodeMirror(host => a.appendChild(host), {
            value: 
sanitize(`# Difos

Verschiedene Formatierungen, wie **Fett**, __Kursiv__, %%Kapitälchen%% oder **__Fett Kurisv__**. Es geht __auch mit **überlappendem__ Layout**! Krass, oder?

Und [Links!](https://google.de/)

Mehrfache Leerzeilen- und Zeichen  werden   im Allgemeinen ignoriert.

## Subsections 
gibt es auch!
Und Formeln wie $\\sum_{x=0}^{\\infty}\\pi$ oder $x=0$ oder sogar 
$\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$
gibt es au$\\chi$!
Und natürlich \`Quellcode\` mit allen Schikanen! 
\`\`\`pseudocode
a <- b
c <- d
while i>0
    i<-i-1
end
\`\`\`

`)
, 
            mode: "difosMode",
            theme: "difos-default",
            extraKeys: keyMaps,
            lineNumbers: false,
            autofocus: true,
            dragDrop: true,
            indentUnit: 2,
            tabSize: 4,
            indentWithTabs: true,
            placeholder: "Hier schreiben",
            lineWrapping: true,
            foldGutter: false,
        }as any);

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

