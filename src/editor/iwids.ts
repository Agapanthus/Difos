
import * as CodeMirror from "codemirror";

export interface InlineWidget {
    ch: number,
    line: number,
    str: string,
    inuse: boolean,
    obj: any,
    center: boolean,
    width: number,
    height: number
}

export interface CMEdit<State> extends CodeMirror.Editor {
    state: State
}

export type CMEditEx = CMEdit<{
    iwids: Array<InlineWidget>, 
    navigateFormula: boolean, 
    formula: boolean, 
    autocomplete: {
        openpairs: string,
        solidpairs: string,
        prevent: Array<string>,
        keymap: object
    },
    autocomplete_keymap: object,
    oldLength: number,
    indentWrap: boolean,
}>;