const AutomatonEngine = require('@open-automaton/automaton-engine/src/automaton-engine.js');
const Emitter = require('extended-emitter');
const Arrays = require('async-arrays');
const Δ = require('async-fn-callback');
const request = require('postman-request');
const querystring = require('querystring');

const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;

const DOM = require("@open-automaton/automaton-engine/src/dom-tool.js").DOM;


let Automaton = {};

let JSDOMBrowser = function(opts){
    this.options = opts || {}

    let page = null;
    let ob = this;
    this.console = new jsdom.VirtualConsole();

    //DEP
    this.getBrowser = async function(){}
    this.getPage = async function(id){}
    this.closeBrowser = async function(){}

    this.interior_xpath = async function(selector, pageId){
        console.log('XPATH');
        let page = await ob.getPage(pageId);
        let text = await page.evaluate(() =>
            document.evaluate(
                selector,
                document,
                null,
                XPathResult.STRING_TYPE
            ).stringValue
        );
        return text;
    }

    this.interior_select = async function(selector, pageId){
    }

    this.interior_regex = async function(selector, pageId){
    }

    this.interior_navigateTo = async function(options, pageId){
        try{
            let id = pageId || ob.defaultPage;
            let location = options.uri || options.url;
            if(location){
                if(options.form && options.data && options.submit){
                    let html = this.page.serialize();
                    let form = this.page.window.document.querySelector(
                        `*[name='${options.form}']`
                    );
                    let url    = form.getAttribute('action');
                    let type   = form.getAttribute('enctype') || 'application/x-www-form-urlencoded';
                    let method = form.getAttribute('method') || 'get';
                    let body = '';
                    switch(type.toLowerCase()){
                        case 'application/x-www-form-urlencoded':
                        case 'x-www-form-urlencoded':
                            body = querystring.stringify(options.data);
                            break;
                        case 'application/json':
                        case 'json':
                            body = JSON.stringify(options.data);
                            break;
                        defaut : throw new Error('Unsupported form encoding:' + type);
                    }
                    if(url.indexOf('://') === -1){
                        //not fully qualified
                        if(url[0] === '/'){
                            //absolute
                            url = this.page.window.location.origin + url;
                        }else{
                            //relative, also super naive
                            url = this.page.window.location.href + url;
                        }
                    }
                    let requestOptions = {
                        url    : url,
                        method : method.toUpperCase(),
                        body   : body,
                        headers : {
                            'Content-type' : type
                        }
                    };
                    let requestBody = await new Promise((resolve, reject)=>{
                        request(requestOptions, (error, response, body)=>{
                            if(error) return reject(error);
                            resolve(body);
                        });
                    });
                    //todo: stuff into DOM
                    return requestBody;
                }else{
                    this.page = await JSDOM.fromURL(location, {
                        pretendToBeVisual: true,
                        runScripts: "dangerously",
                        resources: "usable",
                        virtualConsole: ob.console
                    });
                    let result = this.page.serialize();
                    return result;
                }
            }else{
                throw new Error('Unsupported action');
            }
        }catch(ex){
            console.log(ex);
        }
    }

    this.defaultPage = '#';

}

JSDOMBrowser.prototype.navigateTo = function(opts, cb){
    Δ(this.interior_navigateTo, opts, cb);
}

JSDOMBrowser.prototype.xpath = function(opts, cb){
    Δ(this.interior_xpath, opts, cb);
}

JSDOMBrowser.prototype.regex = function(opts, cb){
    Δ(this.interior_regex, opts, cb);
}

Automaton.JSDOMEngine = AutomatonEngine.extend({
    fetch : function(opts, cb){
        this.browser.navigateTo(opts, (err, result, page)=>{
            cb(result);
        });
    },
    cleanup : function(cb){
        this.closeBrowser().then(()=>{
            cb();
        }).catch((ex)=>{
            cb(ex);
        })
    },
    xpathText : function(opts, cb){
        this.browser.xpath(opts, (err, result)=>{
            cb(null, result);
        });
    },
    regexText : function(opts, cb){
        this.browser.regex(opts, (err, result)=>{
            cb(null, result);
        });
    },
    selectText : function(opts, cb){
        this.browser.select(opts, (err, result)=>{
            cb(null, result);
        });
    },
}, function(opts){
    this.browser = new JSDOMBrowser();
    this.options = opts || {};
    this.children = [];
    (new Emitter).onto(this);
});

module.exports = Automaton.JSDOMEngine;
