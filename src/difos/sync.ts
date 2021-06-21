


import * as $ from "jquery";


import * as util from "../util/util";



class callOnceInNMS {

    private ms: number;
    public f: ()=>void;
    private lastCall: number;
    private hasTimeout: boolean;

    constructor (f: ()=>void, ms: number) {
        this.ms = ms;
        this.f = f;
        this.lastCall = Date.now();
        this.hasTimeout = false;

    }

    public call() {
        if(this.lastCall+this.ms < Date.now()) {
            this.lastCall = Date.now();
            this.f();
        } else if(!this.hasTimeout) {
            const _t = this;
            this.hasTimeout = true;
            setTimeout(_ => {
                _t.hasTimeout = false;
                _t.call();
            }, this.lastCall + this.ms - Date.now() + 1);
        } 
    }

}


import {style, keyframes, types, media } from 'typestyle';
const opa0 = style({ opacity: 0, transition: "all 2s" });

const caller = new callOnceInNMS(()=>{}, 1000*3);
let notify;
$( document ).ready(() => {
    notify= $("body").append("<div id='savednote' class='"+opa0+"' style='background: #fff; position: fixed; top:0; right: 0; padding: 10px; font-size: 17px;box-shadow: 1px 1px 5px 0 #aaa;'>gespeichert</div>");
});
export function asyncChanges(changes: object, id: number) {
    //const m = (new Date().getMilliseconds())
  
    document.title = "Difos *";
    caller.f = () => $.ajax({
        type: "POST",
        url: "http://localhost/write.php",
        data: { data: JSON.stringify(changes) },
        success: e => { 
            if(e !== "succ") {
                console.error(e);
                alert("Check your connection! Something went wrong!\n"+e);
            } else {                
                $("#savednote").removeClass(opa0);
                setTimeout(() => $("#savednote").addClass(opa0),5);
                document.title = "Difos";
            }
        },
        error: e => {
            console.error(e);
            alert("Check your connection! Something went wrong!");
        }
    });

    setTimeout(() => {
        caller.call()
    }, 0);
}


export function readDB(callback: ((string)=>void)) {
    $.ajax({
        type: "GET",
        url: "http://localhost/db.json", // "./db.json", 
        success: data =>( console.log(data), callback(data) ),
        error: e => console.error(e)
    });


//callback( [{"id":8,"title":"","body":"## Differenzierbarkeit\n * $f:D\\to\\mathbb{R}\\%size77x23$\n * $x_0\\%size21x32$ innerer Punkt von $D\\subset\\mathbb{R}\\%size56x23$\nFolgendes ist äquivalent:\n\n\ti) $f\\%size15x23$ diffbar in $x_0\\%size21x32$\n\tii) $\\lim_{h\\to0}\\frac{f\\left(x_0+h\\right)-f\\left(x_0\\right)}{h}\\%size224x53$  existiert\n\tiii) $\\lim_{x\\to x_0}\\frac{f\\left(x\\right)-f\\left(x_0\\right)}{x-x_0}\\%size193x60$ existiert\n\tiv) $\\exists a\\in\\mathbb{R}\\quad\\forall\\epsilon>0\\quad\\exists\\delta>0\\quad\\forall0<\\left|h\\right|<\\delta\\%size280x27$\n$\\left|\\frac{f\\left(x_0+h\\right)-f\\left(x_0\\right)}{h}-a\\right|<\\epsilon\\%size233x89$\n\tv) $\\varphi:D\\to\\mathbb{R}\\%size76x23$ in $x_0\\%size21x32$ stetig, $\\varphi\\left(x_0\\right)=0\\%size86x36$ und $\\exists b\\in\\mathbb{R}\\forall x\\in D\\%size115x23$ \n$f\\left(x\\right)=f\\left(x_0\\right)+\\left(x-x_0\\right)b+\\left(x-x_0\\right)\\varphi\\left(x\\right)\\%size354x68$\n\tAußerdem ist dann\n$\\lim_{x\\to x_0}\\frac{f\\left(x\\right)-f\\left(x_0\\right)}{x-x_0}=b=f'\\left(x_0\\right)\\%size303x92$\n vi) $f'_+\\left(x_0\\right)=f'_-\\left(x_0\\right)\\%size163x36$ existieren.","ref":"","src":"VI.1.1, VI.1.3, VI.1.6","subj":"AnaII","type":"Definition","found":1}]);

}