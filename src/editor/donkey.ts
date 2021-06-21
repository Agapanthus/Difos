

import * as $ from "jquery";

//const Vibrant = require('node-vibrant');

import * as util from "../util/util";


export function getImages(keyword: string, callback: ((a: string)=>void)) {

    if(keyword) keyword  = keyword.split(" ").join(",");

    $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
    {
       // tags: keyword,
      //  tagmode: "any",
        size: "thumbnail",
        format: "json"
    },
    function(data) {
        
        if(data.items.length === 0) {
            console.warn("Nothing found for " + keyword + ". Using another one.")
            getImages(undefined, callback);
            return;
        }

        var rnd = Math.floor(Math.random() * data.items.length);

        var image_src = data.items[rnd]['media']['m'].replace("_m", "_b");

        //$('body').css('background-image', "url('" + image_src + "')");
    
        /*
        Vibrant.from(image_src).getPalette(
            (err, palette) => {
                const c = palette.Vibrant;
                const rgba = "rgba( " + c._rgb[0] + "," + c._rgb[1] + "," +c._rgb[2] + ",1)";
                callback("<div style='height: 5000px; width: 100%; background: "+rgba+";'>"
                +"<div style='box-shadow: 0 0 80px 80px "+rgba+" inset; width: 100%;height: 400px; background: url(\""+ image_src + "\"); background-position: top;background-repeat: no-repeat;background-size: cover;' ></div></div>");

            });*/
            
        
           
        callback(image_src);
            
            //"<div style='height: 5000px; width: 100%; background: \""+ image_src + "\"; background-size: cover;'></div>");


 
    });

}