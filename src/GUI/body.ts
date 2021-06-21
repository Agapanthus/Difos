import {style, keyframes, types, media } from 'typestyle';
import * as $ from "jquery";
import * as styles from "../util/styles";


////////////////////////////////////////////////////////////////////////////////
/******************************************************************************/

export namespace body {

    const loaderSize = 30;
    const loaderB = 4;
    const n = "template_body";
    
    export const body = style({
        fontFamily: styles.fonts[0],
        fontSize: "17px",

        display: "block",
        //width: "50%",
        position: "relative",
        border: "none",
        //borderTop: "3px solid " + styles.c8,
        margin: "0 auto",
        padding: "20px",
        background: "transparent"
    },
    media({minWidth:0, maxWidth:600}, {
        width: "100%",
        padding: "10px",
    }),
    media({minWidth:601, maxWidth:1000}, {
        width: "90%",
        padding: "20px",
    }),
    media({minWidth:1001}, {
        width: '900px',
        padding: "20px",
    }),
    );

}
