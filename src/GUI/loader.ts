import {style, keyframes, types} from 'typestyle';


////////////////////////////////////////////////////////////////////////////////
/******************************************************************************/

export namespace loader {

    const loaderSize = 30;
    const loaderB = 4;

    const animationOuter = keyframes({
        "0%": { transform: "rotate(0)" },
        "25%": { transform: "rotate(180deg)" },
        "50%": { transform: "rotate(180deg)" },
        "75%": {transform: "rotate(360deg)" },
        "100%": {transform: "rotate(360deg)" }
      });
      const animationInner = keyframes({
        "0%": {height:"0"},
        "25%": {height:"0"},
        "50%": {height:"100%"},
        "75%": {height:"100%"},
        "100%": {height:"0"}    
      });

      
    export const loader = style({
    
        display: "inline-block",
        width: loaderSize + "px",
        height: loaderSize + "px",
        position: "relative",
        border: loaderB + "px solid #DDD",
        animation: animationOuter + " 4s infinite ease",

        $nest: {
            "& div": {
                verticalAlign: "top",
                display: "inline-block",
                width: "100%",
                background: "#DDD",
                animation: animationInner + " 4s infinite ease-in",
            },
        }
    });
}
