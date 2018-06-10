

import { Editor } from "../editor/editor";
import * as styles from "../util/styles";
import { body } from "../GUI/body";

import { asyncChanges, readDB } from "./sync";

import * as $ from "jquery";

import {style, keyframes, types, media } from 'typestyle';

import * as util from "../util/util";

////////////////////////////////////////////////////////////////////////////////
/******************************************************************************/

namespace css {

    
    export const body = style({
        fontFamily: styles.fonts[0],
        fontSize: "17px",

        display: "block",
        width: "50%",
        position: "relative",
        border: "none",
        //borderTop: "3px solid " + styles.c8,
        margin: "0 auto",
        padding: "20px",
        background: "transparent"
    });

    export const typebtn = style({
        fontFamily: styles.fonts[0],
        fontSize: "17px",

        display: "inline-block",
        borderRadius: "5px",
        margin: "2px 4px",
        padding: "2px",
        cursor: "pointer",
        color: "#aaa",
        border: "1px solid transparent",
        userSelect: "none",

        $nest: {
            "&.selected, &:hover.selected": {
                border: "1px solid #aaa",
                cursor: "default",
                background: "transparent",
                textDecoration: "none"
            },
            "&:hover": {
                textDecoration: "underline"
            }
        }
    });

    export const btndel = style({
        position: "absolute",
        right: "0",
        top: "5px"
    });

    export const inputF = style({
        border: "none",
        width: "90px",
        padding: "4px",
        paddingBottom: "0",
        marginBottom: "4px",
        background: "#fcfcfc",
        fontFamily: styles.f.code,
        color: "#000",
        $nest: {
            "&::placeholder": { /* Chrome, Firefox, Opera, Safari 10.1+ */
                color: "#f00",
            }
        }
    });

    export const propT = style({ 
        margin: "3px 3px 3px 0", 
        display: "inline-block", 
        verticalAlign: "top",
        color: "#aaa",
    });

    
    export const sep = style({
        borderTop: "3px solid #2af",
        marginBottom: "10px",
        marginTop: "40px",
        background: "#f9f8f8",
    })

    export const ele = style({
        display: "block",
        $nest: {
            "& .con": {
                display: "none",
            },
            "&.show .con": {
                display: "block"
            },
            "& .body": {
            },
            "&.definition .body": {
                border: "1px solid transparent",
                background: "#f5f5f5",
                borderColor: "#ddd",
                borderRadius: "3px",
                padding: "0 20px 10px 20px"
            },
            "& .CodeMirror": {
                background: "transparent"
            }
        }
    });


    export const search = style({
        display: "block",
        width: "100%",
        fontSize: "20px",
        padding: "5px",

    });
}


////////////////////////////////////////////////////////////////////////////////
/******************************************************************************/

let store = [];
function ondelete(id: number) {
    store = util.filter(store, e => e.id !== id);
    asyncChanges(store, id);
}
/*
function onchangeTitle(id: number, change: string) {
    asyncChanges(store, id);
    for(let e of store) {
        if(e.id === id) {
            e.title = change;
            return;
        }
    }
    store.push({id: id, title: change, body:"",  ref:"", src:"", subj:"", type:""});
}*/
function onchangeBody(id: number, change: string) {
    asyncChanges(store, id);
    for(let e of store) {
        if(e.id === id) {
            e.body = change;
            return;
        }
    }
    store.push({id: id, title: "", body:change, ref:"", src:"", subj:"",  type:""});
}
function onchangeType(id: number, change: string) {
    asyncChanges(store, id);
    for(let e of store) {
        if(e.id === id) {
            e.type = change;
            return;
        }
    }
    store.push({id: id, title: "", body:"", ref:"", src:"", subj:"", type:change});
}

function onFieldChange(id: number) {
    asyncChanges(store, id);
    const ref = $(`#difos_e_${id} #ref`).val();
    const subj = $(`#difos_e_${id} #subj`).val();
    const src = $(`#difos_e_${id} #src`).val();
    for(let e of store) {
        if(e.id === id) {
            e.ref = ref;
            e.src = src;
            e.subj = subj;
            return;
        }
    }
    store.push({id: id, title: "", body:"", ref:"", src:"", subj:"", type:""});
    
}

function createElement(ele: JQuery, id: number) {
    ele.append((`<div><div>
    <div id="difos_e_${id}" class="${css.ele}">
    <div class ="${css.sep}">
    <div class="${body.body} " style="padding:5px">
        <div class="${css.typebtn}">Satz</div>
        <div class="${css.typebtn}">Definition</div>
        <div class="${css.typebtn}">Korollar</div>
        <div class="${css.typebtn}">Beispiel</div>
        <div class="${css.typebtn}">Kommentar</div>
        <input style="width:60px" class="${css.inputF}" id="subj" placeholder="Fach"> </input>
        <input style="width:200px" class="${css.inputF}" id="src" placeholder="Quelle"> </input>
        <input style="width:100px" class="${css.inputF}" id="ref" placeholder="Referenzen"> </input>
        <div class="con ${css.typebtn} ${css.btndel}">Löschen</div>
    </div>
    </div>
   
    <div class="${body.body}" style="padding:0">
    <div class="con" >
        <div class="body"></div>
    </div>
    </div>
    </div></div></div>
    `));

    $(`#difos_e_${id} .${css.inputF}`).bind("input", e => onFieldChange(id));


    $(`#difos_e_${id} .${css.typebtn}`).on("click", e => {

        const t = $(e.toElement).text();
        if(t === "Löschen") {
            if(confirm("Wirklich löschen?")) {
                $(`#difos_e_${id}`).parent().parent().remove();
                ondelete(id);
            }
            return;
        }
        if($(`#difos_e_${id} .selected`).length === 0) {
            //const c = "_#Fach:_ \n_#Source:_ \n_#Reference:_ \n
            const c = "## Titel\n * ";
            createElement(ele, id+1);
            $(`#difos_e_${id+1} #subj`).val($(`#difos_e_${id} #subj`).val());
            $(`#difos_e_${id}`).addClass("show");
            //new Editor($(`#difos_e_${id} .summary-e`)[0], "Inhalt", changes => { onchangeTitle(id, changes); });
            new Editor($(`#difos_e_${id} .body`)[0], c, changes => { onchangeBody(id, changes); });
            onchangeBody(id, c);
           // onchangeTitle(id, "Inhalt");
        }
        
        $(`#difos_e_${id}`).removeClass("definition").removeClass("satz");
        switch(t) {
            case "Definition":
                $(`#difos_e_${id}`).addClass("definition");
                break;
            case "Satz":
                $(`#difos_e_${id}`).addClass("satz");
                break;
        }

        $(`#difos_e_${id} .${css.typebtn}`).removeClass("selected");
        $(e.toElement).addClass("selected");
        $(`#difos_e_${id}`).attr("type", t);
        onchangeType(id, t);
    });

    for(let e of store) {
        if(e.id === id) {
            $(`#difos_e_${id}`).addClass("show");
           // new Editor($(`#difos_e_${id} .summary-e`)[0], e.title, changes => { onchangeTitle(id, changes); });
            new Editor($(`#difos_e_${id} .body`)[0], e.body, changes => { onchangeBody(id, changes); });

            $(`#difos_e_${id} #subj`).val(e.subj);
            $(`#difos_e_${id} #ref`).val(e.ref);
            $(`#difos_e_${id} #src`).val(e.src);
            
            for(let t of $(`#difos_e_${id} .${css.typebtn}`).toArray() ) {
                if($(t).text() === e.type) $(t).addClass("selected");
            }
            switch(e.type) {
                case "Definition":
                    $(`#difos_e_${id}`).addClass("definition");
                    break;
                case "Satz":
                    $(`#difos_e_${id}`).addClass("satz");
                    break;
            }
    

            return;
        }
    }

} 

function filterByKey(store: any[], key: string) {
    for(let e of store) {
        if(e.subj.indexOf(key) >= 0
            || e.src.indexOf(key) >= 0
            || e.body.indexOf(key) >= 0) {
                e.found++;
        }
    }
}

export function startEditor(ele) {

    $(ele).append((`<div class="${body.body}"> <input placeholder="Suchen..." class="${css.search}"> </input></div>`));

    $("."+css.search).bind("input",g => {
        const keys = $("."+css.search).val().toString().toLowerCase().split(" ");
        
        const lstore = [];
        for(let e of store) {
            lstore.push({body: e.body.toLowerCase(), src: e.src.toLowerCase(), subj: e.subj.toLowerCase(), id: e.id});
        }
        
        if(keys.length === 1 && keys[0].length < 1) {
            for(let e of lstore) {
                e.found = 1;
            }

        } else {
            for(let e of lstore) {
                e.found = 0;
            }
            for(let k of keys) {
                filterByKey(lstore, k);
            }
        }
        for(let e of lstore) {
            //console.log(e.found)
            $(`#difos_e_${e.id}`).css("display", (e.found === keys.length) ? "block" : "none");
        }

    });

    readDB(c => {
        store = c;
        let maxid = 0;
        store = util.filter(store, e => e.type.length > 0);
        for(let e of store) {
            createElement($(ele), e.id);
            if(maxid < e.id) maxid = e.id;
        }
        createElement($(ele), maxid + 1);
    });

  

   // new Editor(
}