


import * as $ from "jquery";


import * as util from "../util/util";





export function asyncChanges(changes: object, id: number) {
  //const m = (new Date().getMilliseconds())
  
    setTimeout(
        _ => $.ajax({
            type: "POST",
            url: "http://localhost/write.php",
            data: { data: JSON.stringify(changes) },
            success: e => {  },
            error: e => console.error(e)
        }),0);
}


export function readDB(callback: ((string)=>void)) {
    $.ajax({
        type: "GET",
        url: "http://localhost/db.json",
        success: data =>( console.log(data), callback(data) ),
        error: e => console.error(e)
    });


}