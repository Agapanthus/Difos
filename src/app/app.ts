import { enableJS } from "../util/scriptblocker";
import { loader } from "../GUI/loader";
import * as styles from "../util/styles";
import { body } from "../GUI/body";
import * as Modernizr from 'modernizr';
import * as WebFont from "webfontloader";
import { _math } from "../editor/math";
import { Editor } from "../editor/editor";

import { startEditor } from "../difos/ui";


import * as $ from "jquery";

const iconLock = require("../icons/icons8_Lock_50px.png");

const _body: (a: string) => string = (a) => `<div class='${body.body}'>${a}</div>`;

const buildGUI: () => void = () => {

  $("#GUIBase").html( (`<div id="mq1"></div>`) + _body(`<div id="mq2"></div>`) 
      + _body(`<span>Copyright 2018 Eric Skaliks. <a href="http://skaliks.blue/impressum/Datenschutz">Impressum</a>. Fork me on <a href="https://github.com/Agapanthus/Difos">Github</a>. <br>Icons by <a href="https://icons8.com/">Icons 8</a></span>`));

  $("#mainloader").css("opacity","0");
  setTimeout(()=> $("#mainloader").remove() );

  startEditor(document.getElementById("mq1"));
  
  //new Editor(document.getElementById("mq2"), "# Test\nKann man das machen?\nAlso: $a=\\over{{x^2+1},3}$\nund so weiter?");

  //new Editor(document.getElementById("mq1", "# Difos Beta\r\nDifos ist ein minimalistischer Editor f\u00FCr wissenschaftliche Dokumente. Dabei ist er darauf optimiert, sodass kleine Gruppen in k\u00FCrzester Zeit mit verschiedensten Ger\u00E4ten sauber formatierte Dokumente erstellen k\u00F6nnen. Dieses Dokument ist selbst in Difos erstellt und kann hier vor Ort und Stelle in vollem Umfang bearbeitet werden (-;\r\nZurzeit ist der Editor allerdings noch in Entwicklung. Im Folgenden werden einige bereits umgesetzte Funktionen vorgestellt. \r\n$\\sum_{x=0}^{\\infty}\\frac{\\left(x-1\\right)^2\\lfloor\\alpha\\rfloor}{\\zeta\\left(x\\right)}\\%size134x81$\r\nMit Formeln sollte man aber nach wie vor noch vorsichtig sein... Ich habe dich gewarnt (-;\r\n## Formatierung\r\nMan kann Text formatieren, indem man ihn mit Steuerzeichen ummantelt. Steuerzeichen kann man anzeigen oder verstecken, indem man  `Ctrl`+`1 `  dr\u00FCckt. Alle Funktionen von Difos sind mit Steuerzeichen zugreifbar, z.B. *fett*, _kursiv_, ~durchgestrichen~, %Kapit\u00E4lchen%, `Quellcode` oder $Mathematisch\\%size115x23$. Auf diese Weise ist ein Difos-Dokument vollst\u00E4ndig durch den Text beschrieben, aus dem es besteht und ben\u00F6tigt keine komplizierten Formate wie `docx` oder `odf`.\r\nEs ist wichtig, das Formatierungszeichen nur dann wirksam sind, wenn auf das \"beginnende\" Zeichen kein Leerzeichen oder Satzzeichen folgt. So kann man zum Beispiel von 97% Rabatt auf 1.99$ reden, ohne in Kapit\u00E4lchen zu enden. Au\u00DFerdem \u00FCberspannen Formatierungszeichen niemals mehr als eine Zeile (mit der Ausnahme von #Algorithmen). Difos kommt einem bei der Formatierung etwas entgegen: So werden automatisch Paare von Steuerzeichen erstellt, schlie\u00DFende Steuerzeichen kann man nicht verdoppeln und wenn man etwas markiert hat, wird der Text nicht ersetzt, sondern formatiert.\r\nInnerhalb von `Code` und $math\\%size43x23$ kann man \u00FCbrigens alle Formatierungszeichen verwenden, ohne dass sie eine Wirkung haben, zum beispiel `* und $`. Gedankenstriche -- entsprechen zwei normalen `-`. Hat man einen Beweis zuenede gef\u00FChrt, schreibt man am Ende einfach nach einem Leerzeichen `[]` oder `qed`. []\r\n## Listen\r\nVerschiedene Listen werden von Difos erkannt und dann sch\u00F6n formatiert und automatisch weitergez\u00E4hlt. Dazu macht man einfach so viele Leerzeichen oder Tabs an den Anfang einer Zeile, wie man die Liste einr\u00FCcken will und schreibt dann ein Listenzeichen hin.\r\n 1. Zum Beispiel eine klassische hochz\u00E4hlende\r\n 2. Liste ist ganz einfach.\r\n\ti) ...oder mit \r\n ii) r\u00F6mischen Zahlen, \r\n\tiii) wem's gef\u00E4llt.\r\n iv) Und man kann Listen...\r\n  a) ...auch verschachteln...\r\n  ...und lange Eintr\u00E4ge einfach in der n\u00E4chsten Zeile weiterschreiben...\r\n \tb) ...ohne, dass die Listenz\u00E4hlung dabei kaputt geht.\r\n  c) ...oder in einer alphabetischen Liste `c`...\r\n  d) ...mit r\u00F6misch `ci` fortgesetzt wird.\r\n v) Da f\u00E4llt mir ein...\r\n \t* ...unnummerierte Listen gibt es auch.\r\n  * Dazu kann man einfach `*` tippen...\r\n  - ...oder `-`...\r\n  > ...oder `>`.\r\n## Shortcuts\r\nBisher ist der gesamte Funktionsumfang von Difos nur \u00FCber Shortcuts zug\u00E4nglich -- sp\u00E4ter soll aber noch eine Kontext-Toolbar dazu kommen. Einige hilfreiche Shortcuts sind:\r\n * `Ctrl`+`1 ` Schaltet die Sichtbarkeit der orangen Steuersymbole um\r\n * `Ctrl`+`2 ` Schaltet zwischen grafischer und texbasierter Anzeige f\u00FCr Formeln um \r\n   Vorsicht! Bei diesem Feature kommt es h\u00E4ufig zu Fehlern!\r\nDa Difos auf [Codemirror](https://codemirror.net) basiert, sind unter anderem auch folgende Funktionen verf\u00FCgbar:\r\n * Mit `Ctrl`+linke Maustaste lassen sich mehrere Cursor erstellen und mehrere Textbereiche markieren. Man kann dann an mehreren Textstellen gleichzeitig arbeiten.\r\n * Mit den Pfeiltasten lassen sich die Cursor bewegen. H\u00E4lt man dabei `Ctrl` gedr\u00FCckt, springt man immer direkt zum Wortanfang bzw. Ende. H\u00E4lt man `Shift` gedr\u00FCckt, wird die zur\u00FCckgelegte Strecke markiert.\r\n * Mit `Ctrl`+`Z ` und `Ctrl`+`Y ` kann man Schritte r\u00FCckg\u00E4ngig machen und wiederholen.\r\n * Mit `Tab` kann man die Auswahl einr\u00FCcken, mit `Tab`+`Shift` die Einr\u00FCckung verkleinern.\r\n * `Pos1` und `End` tun, was man erwartet.\r\n## Mathematik\r\nFormeln schreibt man einfach mitten in die Zeile $x=0\\%size41x23$ oder schreibt sie in eine eigene Zeile, sodass sie sch\u00F6n gro\u00DF werden:\r\n$\\int_a^be^x\\%size42x54$\r\nDazu wird [Mathquill](http://mathquill.com/) verwendet. Neben den offensichtlichen M\u00F6glichkeiten f\u00FCr Text, Klammern und Hoch- und Tiefstellen mit `^` und `_` gibt es noch die m\u00F6glichkeit, einige Latex-Befehle wie etwa `\\sum` einzutippen oder g\u00E4ngige Symbole wie $\\le\\%size23x23$ direkt als `<=` zu tippen. Einige Beispiele sind\r\n * `a<=b` als $a\\le b\\ \\%size47x23$\r\n * `\\Q` als $\\mathbb{Q}\\%size18x23$\r\n * `\\o` als $\\varnothing\\%size24x23$\r\n * `A \\ni a` als $A\\ni a\\%size46x23$\r\n * `\\pmatrix` als $\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}\\%size82x58$, wobei man mit `Shift`+`Enter`,`Backspace` bzw. `Space` Zeilen und Spalten hinzuf\u00FCgen und sobald sie leer sind entfernen kann.\r\n## Ausblick\r\n### Formatierung\r\n\t* Links sollen anklickbar werden\r\n\t* `*` bzw. andere Formatierungszeichen sollen als Listenzeichen und in leeren Mathe- oder Quellcodeumgebungen nicht automatisch verfollst\u00E4ndigt werden\r\n\t* Ein kleines Men\u00FC, dass immer nahe dem Cursor ist und die wichtigsten Funktionen, kontextbasiert, anbietet.\r\n\t* Mehrfache Leerzeichen und fehlende Leerzeichen vor und nach Umgebungen unterdr\u00FCcken\r\n * Eine Suchen-und-Ersetzen-Funktion soll eingef\u00FCgt werden\r\n * Steuerzeichen sollen in den \"aktiven\" Zeilen automatisch angezeigt und sonst versteckt werden\r\n * Man soll Referenzen wie #diese oder @jene erstellen k\u00F6nnen, um sich auf Personen oder andere Dokumente zu beziehen, ohne einen Link herauszusuchen.\r\n * Listen sollen einr\u00FCckbar sein, indem man nach dem Listenzeichen `tab` dr\u00FCckt.\r\n * Formatierungszeichen sollen \u00FCberall escape-bar sein.\r\n * Rechtschreibkorrektur\r\n * Tabellen\r\n### Medien\r\n * Medien wie Bilder, Videos, PDFs und Audio sollen im Editor angezeigt werden\r\n Das soll so gehen: \r\n![Eine Bildunterschrift](http://bild.de)\r\n * Medien sollen einfach in den Editor gezogen werden k\u00F6nnen, hochgeladen, kovertiert und f\u00FCr das Dokument bereitgestellt\r\n### Kommunikation\r\n * Kollaboratives schreiben: \u00C4hnlich Etherpad soll das schreiben an einem Dokument von mehreren Editoren aus erm\u00F6glicht werden. Die \u00C4nderungen werden, zusammen mit ihrem jeweiligen Autor, in Echtzeit zwischen den Instanzen synchronisiert.\r\n * Die \u00C4nderungshistorie soll durchsuchbar werden\r\n### Formeln\r\n * Formeln mit Codemirror-Auswahl kompatibel machen\r\n * API f\u00FCr Formeln aktualisieren, erweitern und Schnellschreibmakros anpassen\r\n * Matrizen, Cases und Eqnarray unterst\u00FCtzen. Vielleicht sogar irgendwie mit KaTeX verfeinern?\r\n### Code \r\nBeginnt man Quellcode in einer neuen Zeile, soll man eine Latex-artige Algorithm-Box mit Syntaxhighlighter erstellen k\u00F6nnen, etwa so:\r\n\r\n`Haskell Binomial \r\nn \\`choose\\` k\r\n    | k < 0     = 0\r\n    | k > n     = 0\r\n    | otherwise = factorial n \\`div\\` (factorial k * factorial (n-k)) `\r\n\r\n### Komptabilit\u00E4t\r\n *  Exportieren in folgende Formate soll m\u00F6glich werden:\r\n  * \"Richtiges\" LaTeX\r\n  * Lyx Copy-Paste-able\r\n  * Markdown\r\n  * HTML\r\n  * PDF mit individuellem Header\r\n\r\n") );
};

window.onload = ()=> {
  enableJS();

  if(!Modernizr.csstransitions) alert("TODO: Error: Transition");
  if(!Modernizr.svg) alert("TODO: Error: SVG");


  WebFont.load({
    google: {
      families: styles.fonts
    },
    active: function() {
      console.log("Loading finished!");
      buildGUI();
    }
  });

};

