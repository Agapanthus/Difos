


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
        url: "http://localhost/db.json",
        success: data =>( console.log(data), callback(data) ),
        error: e => console.error(e)
    });


}