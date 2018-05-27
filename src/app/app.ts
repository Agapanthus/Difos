import { enableJS } from "../util/scriptblocker";
import { loader } from "../GUI/loader";
import * as styles from "../util/styles";
import { body } from "../GUI/body";
import * as Modernizr from 'modernizr';
import * as WebFont from "webfontloader";
import { _math } from "../editor/math";
import { Editor } from "../editor/editor";


import * as $ from "jquery";

const iconLock = require("../icons/icons8_Lock_50px.png");

const _body: (a: string) => string = (a) => `<div class='${body.body}'>${a}</div>`;

const buildGUI: () => void = () => {

  $("#GUIBase").html(_body(`<div id="mq1"></div>`) /* + _body(`<img src=${iconLock}></img>`)*/ + _body(`<span>Copyright 2018 Eric Skaliks. <a href="http://skaliks.blue/impressum/Datenschutz">Impressum</a>. Fork me on <a href="https://github.com/Agapanthus/Difos">Github</a>. <br>Icons by <a href="https://icons8.com/">Icons 8</a></span>`));

  $("#mainloader").css("opacity","0");

  new Editor(document.getElementById("mq1") );
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

